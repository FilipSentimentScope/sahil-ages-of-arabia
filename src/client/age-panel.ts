/**
 * Grey-box panel for the age's three goals: research trunk, Great Fort stages, Chronicle.
 * Presentation only; rules in src/core/age.ts. The question button is a visible placeholder
 * until the question bank arrives (P3-07): it records a correct answer without asking anything.
 */
import type { LoadedContent, TownState } from '../core';
import { ageProgress, buildLandmarkStage, recordCorrectAnswer, startResearch, type ActionError } from '../core';
import { fmt, t } from './i18n';

export interface AgePanelHost {
  town(): TownState;
  content: LoadedContent;
  now(): number;
  toast(msg: string): void;
  notice(icon: string, title: string, line: string): void;
  errorText(e: ActionError): string;
  changed(): void;
}

export class AgePanel {
  open = false;
  private signature = '';

  constructor(
    private readonly el: HTMLElement,
    private readonly host: AgePanelHost,
  ) {}

  /** One-line summary for the top bar. */
  summary(): string {
    const p = ageProgress(this.host.town(), this.host.content, this.host.now());
    if (p.complete) return t('ui.age_complete');
    return `🏰 ${t('ui.age_goals')} · 📜 ${p.research.done}/${p.research.of} · 🏯 ${p.landmark.done}/${p.landmark.of} · 📖 ${p.chronicle.done}/${p.chronicle.of}`;
  }

  show(): void {
    this.open = true;
    this.signature = '';
    this.update();
  }

  hide(): void {
    this.open = false;
  }

  update(): void {
    if (!this.open) return;
    const s = this.host.town();
    const p = ageProgress(s, this.host.content, this.host.now());
    // Rebuild when progress or affordability changes, so buttons stay tappable in between.
    const sig = JSON.stringify([p, Math.floor(s.resources.coin / 100), Math.floor(s.resources.knowledge / 10)]);
    if (sig === this.signature) return;
    this.signature = sig;
    this.render();
  }

  private render(): void {
    const s = this.host.town();
    const c = this.host.content;
    const now = this.host.now();
    const g = c.ageGoals;
    const p = ageProgress(s, c, now);
    const node = g.research.trunk[s.age.node];
    const stage = g.landmark.stages[s.age.stage];
    const meter = (done: number, of: number) => `<div class="meter"><i style="width:${(100 * done) / Math.max(1, of)}%"></i></div>`;
    const research = p.research.busyUntil !== null
      ? `<p class="muted">⏳ ${t('ui.researching')}</p>`
      : node
        ? `<button type="button" class="btn primary block" id="btn-research" ${s.resources.knowledge < node.knowledge || s.resources.coin < node.coin ? 'disabled' : ''}>${t('ui.start_research')} · ${fmt(node.knowledge)} 📜 · ${fmt(node.coin)} 🪙</button>`
        : `<p class="muted">✅ ${t('ui.done')}</p>`;
    const fort = stage === undefined
      ? `<p class="muted">✅ ${t('ui.done')}</p>`
      : !p.landmark.unlocked
        ? `<p class="muted">🔒 ${t('ui.fort_locked')}</p>`
        : `<button type="button" class="btn primary block" id="btn-fort" ${s.resources.coin < stage ? 'disabled' : ''}>${t('ui.build_stage')} · ${fmt(stage)} 🪙</button>`;
    this.el.innerHTML = `
      <div class="sheet-head"><h2>🏰 ${t('ui.age_goals')}</h2><button type="button" class="x" id="btn-age-close" aria-label="${t('ui.close')}">✕</button></div>
      ${p.complete ? `<p class="quote">${t('ui.age_complete')}</p>` : ''}
      <div class="active-route"><div class="top"><span class="ic">📜</span><b>${t('ui.research')} ${p.research.done}/${p.research.of}</b></div>
        ${meter(p.research.done, p.research.of)}<p class="muted" style="margin:0 0 8px">${t('ui.research_help')}</p>${research}</div>
      <div class="active-route"><div class="top"><span class="ic">🏰</span><b>${t('ui.fort')} ${p.landmark.done}/${p.landmark.of}</b></div>
        ${meter(p.landmark.done, p.landmark.of)}<p class="muted" style="margin:0 0 8px">${t('ui.fort_help')}</p>${fort}</div>
      <div class="active-route"><div class="top"><span class="ic">📖</span><b>${t('ui.chronicle')} ${p.chronicle.done}/${p.chronicle.of}</b></div>
        ${meter(p.chronicle.done, p.chronicle.of)}<p class="muted" style="margin:0 0 8px">${t('ui.chronicle_help')}</p>
        <button type="button" id="btn-question" class="btn placeholder block">${t('ui.question_placeholder')}</button></div>`;
    this.el.hidden = false;
    const act = (r: { ok: true } | { ok: false; error: ActionError }, msg?: string) => {
      if (!r.ok) this.host.toast(this.host.errorText(r.error));
      else if (msg) this.host.notice('🏰', t('ui.age_goals'), msg);
      this.host.changed();
      this.signature = '';
      this.update();
    };
    this.el.querySelector('#btn-age-close')?.addEventListener('click', () => {
      this.hide();
      this.el.hidden = true;
    });
    this.el.querySelector('#btn-research')?.addEventListener('click', () => act(startResearch(this.host.town(), c, this.host.now()), t('ui.research_started')));
    this.el.querySelector('#btn-fort')?.addEventListener('click', () => act(buildLandmarkStage(this.host.town(), c, this.host.now()), t('ui.stage_built')));
    this.el.querySelector('#btn-question')?.addEventListener('click', () => {
      const r = recordCorrectAnswer(this.host.town(), c, this.host.now());
      act(r, r.ok ? `+${fmt(r.knowledge)} ${t('resource.knowledge')}` : undefined);
    });
  }
}
