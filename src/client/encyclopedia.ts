/**
 * The encyclopedia, in the manner of Civilization's Civilopedia (Filip, 3 Nov): every entry the game
 * has, searchable, by section. Presentation only.
 *
 * Sections: how to play, buildings (generated from content/buildings.json), leaders, history (the
 * Archive pages: open ones in full, the rest listed as still to open, as the GDD makes them a reward
 * for right answers), terms and places. Historical entries show their sources; drafts say so.
 */
import encyclopediaFile from '../../content/encyclopedia/age5.json';
import type { LoadedContent, TownState } from '../core';
import { unlockedArchive } from '../core';
import { BUILDING_ART } from './art';
import { ICON, buildingFacts, provides } from './describe';
import { fmt, t } from './i18n';

interface Entry {
  id: string;
  category: string;
  title: string;
  body: string;
  sources: string[];
  related: string[];
  inGame?: Record<string, string>;
  note?: string;
  image?: string;
  locked?: boolean;
  facts?: string[];
}

const SECTIONS = ['all', 'howto', 'buildings', 'leaders', 'history', 'terms', 'places'] as const;
const SECTION_ICON: Record<string, string> = { all: '📚', howto: '🧭', buildings: '🏠', leaders: '👤', history: '📜', terms: '🔤', places: '📍' };

/** Lower case, without accents or Arabic diacritics, so "fawaid" finds "fawa'id" and "Salah" finds "Ṣalāḥ". */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ًͯ-ٟ']/g, '').toLowerCase();
}

export class Encyclopedia {
  private section: (typeof SECTIONS)[number] = 'all';
  private query = '';
  private history: string[] = [];

  constructor(
    private readonly el: HTMLElement,
    private readonly content: LoadedContent,
    private readonly town: () => TownState,
    private readonly onClose: () => void,
  ) {}

  private entries(): Entry[] {
    const c = this.content;
    const out: Entry[] = (encyclopediaFile.entries as Entry[]).map((e) => ({ ...e }));
    for (const def of c.buildings) {
      out.push({
        id: `bld_${def.id}`,
        category: 'buildings',
        title: t(def.nameKey),
        body: t(`desc.${def.id}`),
        sources: [],
        related: [],
        image: BUILDING_ART[def.id],
        facts: buildingFacts(def, c),
        inGame: { [t('ui.cost')]: `${fmt(def.placeCost)} ${ICON.coin}`, [t('ui.provides')]: provides(def, c).join(' · ') },
      });
    }
    const open = new Set(unlockedArchive(this.town(), c));
    for (const p of c.archive.pages) {
      out.push({
        id: p.id,
        category: 'history',
        title: p.title,
        body: open.has(p.id) ? p.body : '',
        sources: open.has(p.id) ? p.sources : [],
        related: [],
        locked: !open.has(p.id),
      });
    }
    return out;
  }

  /** Open at the list, or straight at one entry. */
  show(entryId?: string): void {
    this.history = [];
    if (entryId) this.openEntry(entryId);
    else this.renderList();
  }

  private renderList(): void {
    this.el.innerHTML = `
      <div class="sheet-head"><h2>📚 ${t('ui.encyclopedia')}</h2><button type="button" class="x" id="btn-enc-close" aria-label="${t('ui.close')}">✕</button></div>
      <input type="search" id="enc-search" class="search" placeholder="🔍 ${t('ui.search')}" value="${this.query.replace(/"/g, '&quot;')}" autocomplete="off" />
      <div class="tabs">${SECTIONS.map((s) => `<button type="button" class="tab ${s === this.section ? 'on' : ''}" data-section="${s}">${SECTION_ICON[s]} ${t(`enc.${s}`)}</button>`).join('')}</div>
      <div id="enc-list" class="enc-list"></div>`;
    this.el.hidden = false;
    this.el.querySelector('#btn-enc-close')?.addEventListener('click', () => this.onClose());
    const search = this.el.querySelector<HTMLInputElement>('#enc-search')!;
    // Only the list redraws while typing, so the search box keeps focus and the keyboard stays up.
    search.addEventListener('input', () => {
      this.query = search.value;
      this.renderItems();
    });
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-section]')) {
      b.addEventListener('click', () => {
        this.section = b.dataset.section as (typeof SECTIONS)[number];
        this.el.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b));
        this.renderItems();
      });
    }
    this.renderItems();
  }

  private renderItems(): void {
    const list = this.el.querySelector<HTMLElement>('#enc-list');
    if (!list) return;
    const q = norm(this.query.trim());
    const found = this.entries().filter((e) => {
      if (this.section !== 'all' && e.category !== this.section) return false;
      if (!q) return true;
      return norm(`${e.title} ${e.body} ${(e.facts ?? []).join(' ')}`).includes(q);
    });
    if (!found.length) {
      list.innerHTML = `<p class="muted">${t('ui.no_results')}</p>`;
      return;
    }
    list.innerHTML = found
      .map((e) => {
        const snippet = e.locked ? t('ui.archive_locked') : e.body.split('\n')[0]!.slice(0, 90) + (e.body.length > 90 ? '…' : '');
        return `<button type="button" class="enc-item ${e.locked ? 'locked' : ''}" data-entry="${e.id}">
          ${e.image ? `<img src="${e.image}" alt="" />` : `<span class="enc-ic">${e.locked ? '🔒' : SECTION_ICON[e.category] ?? '📄'}</span>`}
          <span><b>${e.title}</b><small>${snippet}</small></span></button>`;
      })
      .join('');
    for (const b of list.querySelectorAll<HTMLButtonElement>('[data-entry]')) {
      b.addEventListener('click', () => this.openEntry(b.dataset.entry!));
    }
  }

  private openEntry(id: string): void {
    const all = this.entries();
    const e = all.find((x) => x.id === id);
    if (!e) return this.renderList();
    this.history.push(id);
    const list = this.content.archive.sourceList as Record<string, string>;
    const sources = e.sources.map((s) => `<li>${typeof list[s] === 'string' ? `${s}: ${list[s]}` : s}</li>`).join('');
    const related = e.related
      .map((rid) => all.find((x) => x.id === rid))
      .filter((x): x is Entry => Boolean(x))
      .map((r) => `<button type="button" class="tab" data-entry="${r.id}">${r.locked ? '🔒' : SECTION_ICON[r.category]} ${r.title}</button>`)
      .join('');
    const inGame = e.inGame
      ? `<div class="active-route"><b>🎮 ${t('ui.in_game')}</b><dl class="kv">${Object.entries(e.inGame)
          .map(([k, v]) => `<dt>${t(`enc.k.${k}`) === `[enc.k.${k}]` ? k : t(`enc.k.${k}`)}</dt><dd>${v}</dd>`)
          .join('')}</dl></div>`
      : '';
    this.el.innerHTML = `
      <div class="sheet-head"><button type="button" class="x" id="btn-enc-back" aria-label="${t('ui.back')}">‹</button>
        <h2>${e.title}</h2><button type="button" class="x" id="btn-enc-close" aria-label="${t('ui.close')}">✕</button></div>
      <p class="muted" style="margin:-4px 0 10px">${SECTION_ICON[e.category]} ${t(`enc.${e.category}`)}</p>
      ${e.image ? `<img class="enc-hero" src="${e.image}" alt="" />` : ''}
      ${e.locked ? `<p>🔒 ${t('ui.archive_locked')}</p>` : e.body.split('\n\n').map((p) => `<p style="line-height:1.5">${p}</p>`).join('')}
      ${e.facts ? `<ul class="facts">${e.facts.map((f) => `<li>${f}</li>`).join('')}</ul>` : ''}
      ${inGame}
      ${e.note ? `<p class="muted" style="font-size:12px">ℹ️ ${e.note}</p>` : ''}
      ${sources ? `<details open><summary>${t('ui.sources')}</summary><ul style="font-size:12px">${sources}</ul></details>` : ''}
      ${related ? `<p class="muted" style="margin:12px 0 4px">${t('ui.see_also')}</p><div class="tabs wrap">${related}</div>` : ''}
      ${e.category !== 'howto' && e.category !== 'buildings' ? `<p class="muted" style="font-size:11px">${t('ui.draft_note')}</p>` : ''}`;
    this.el.hidden = false;
    this.el.scrollTop = 0;
    this.el.querySelector('#btn-enc-close')?.addEventListener('click', () => this.onClose());
    this.el.querySelector('#btn-enc-back')?.addEventListener('click', () => {
      this.history.pop();
      const prev = this.history.pop();
      if (prev) this.openEntry(prev);
      else this.renderList();
    });
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-entry]')) b.addEventListener('click', () => this.openEntry(b.dataset.entry!));
  }
}
