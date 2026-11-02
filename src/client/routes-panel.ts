/**
 * Routes sheet and route choice card (grey-box v2). Presentation only: every change goes through
 * src/core/routes.ts.
 *
 * - Route cards are coloured and marked by trip length (errand, day trip by land or sea, season
 *   voyage) with a length gauge, so the time a route takes reads at a glance (Filip, 2 Nov).
 * - A choice opens as a card with both options, their odds in words and the average result.
 * - The sheet is rebuilt only when something actionable changes; countdowns update in place.
 */
import type { ActiveRoute, LoadedContent, RouteDef, TownState } from '../core';
import {
  chooseOption,
  collectRoute,
  decisionDueAt,
  expectedCargoMult,
  freeRouteSlots,
  pendingDecision,
  repairHull,
  routeBaseCoin,
  routeCargo,
  routeDef,
  sendRoute,
  type ActionError,
  type OutcomeDef,
} from '../core';
import { ICON, TRIP_ICON, oddsText, tr, waitText } from './describe';
import { fmt, t } from './i18n';

export interface RoutesHost {
  town(): TownState;
  content: LoadedContent;
  now(): number;
  scale(): number;
  toast(msg: string): void;
  errorText(e: ActionError): string;
  /** Short status banner (icon, title, line). */
  notice(icon: string, title: string, line: string): void;
  openCard(html: string, bind: (el: HTMLElement) => void): void;
  closeCard(): void;
  floatAtTown(text: string): void;
  changed(): void;
}

const LENGTH_NOTCHES: Record<string, number> = { errand: 1, day: 2, long: 3, season: 4 };

export function tripClass(def: RouteDef): string {
  if (def.trip === 'day') return def.sea ? 'trip-day-sea' : 'trip-day-land';
  return `trip-${def.trip}`;
}

export function routeIcon(def: RouteDef): string {
  return def.sea ? (def.trip === 'season' ? '⛵' : '🛶') : (TRIP_ICON[def.trip] ?? '🐪');
}

export class RoutesPanel {
  open = false;
  private signature = '';

  constructor(
    private readonly el: HTMLElement,
    private readonly host: RoutesHost,
  ) {}

  needsAttention(): number {
    const s = this.host.town();
    const now = this.host.now();
    return s.routes.filter((r) => r.returnAt <= now || pendingDecision(s, this.host.content, r.uid, now) !== undefined).length;
  }

  show(): void {
    this.open = true;
    this.signature = '';
    this.update();
  }

  hide(): void {
    this.open = false;
  }

  private stateSignature(): string {
    const s = this.host.town();
    const now = this.host.now();
    const c = this.host.content;
    const routes = s.routes.map((r) => `${r.uid}:${r.returnAt <= now ? 'home' : 'out'}:${pendingDecision(s, c, r.uid, now) ?? '-'}`);
    return JSON.stringify([routes, s.hull, s.resources.coin >= c.routes.hull.repairCost, s.buildings.length]);
  }

  update(): void {
    if (!this.open) return;
    const sig = this.stateSignature();
    if (sig !== this.signature) {
      this.signature = sig;
      this.render();
    }
    const s = this.host.town();
    const now = this.host.now();
    for (const span of this.el.querySelectorAll<HTMLElement>('[data-countdown]')) {
      const uid = Number(span.dataset.countdown);
      const target = uid === 0 ? (s.hull.repairDoneAt ?? now) : (s.routes.find((r) => r.uid === uid)?.returnAt ?? now);
      span.textContent = waitText(target - now, this.host.scale());
    }
    for (const bar of this.el.querySelectorAll<HTMLElement>('[data-progress]')) {
      const r = s.routes.find((x) => x.uid === Number(bar.dataset.progress));
      if (r) bar.style.width = `${Math.min(100, (100 * (now - r.departedAt)) / Math.max(1, r.returnAt - r.departedAt))}%`;
    }
  }

  private render(): void {
    const s = this.host.town();
    const c = this.host.content;
    const out = s.routes.map((r) => this.activeRow(r)).join('');
    const hull = s.hull.repairDoneAt !== null
      ? `<p class="muted">🔧 ${t('ui.repairing')} <span data-countdown="0"></span></p>`
      : s.hull.damaged
        ? `<p class="muted" style="color:var(--warn)">⚠️ ${t('ui.hull_damaged')}</p><button type="button" class="btn block" id="btn-repair" ${s.resources.coin < c.routes.hull.repairCost ? 'disabled' : ''}>🔧 ${t('ui.repair')} · ${fmt(c.routes.hull.repairCost)} ${ICON.coin}</button>`
        : '';
    const free = freeRouteSlots(s, c);
    const cards = c.routes.routes.map((def) => this.sendCard(def, free)).join('');
    this.el.innerHTML = `
      <div class="sheet-head"><h2>🐪 ${t('ui.routes')} <small>${tr('ui.free_slots', { free, slots: c.routes.slots })}</small></h2>
        <button type="button" class="x" id="btn-routes-close" aria-label="${t('ui.close')}">✕</button></div>
      ${hull}
      ${out}
      <div class="rcards">${cards}</div>`;
    this.el.hidden = false;
    this.bind();
  }

  private activeRow(r: ActiveRoute): string {
    const s = this.host.town();
    const c = this.host.content;
    const now = this.host.now();
    const def = routeDef(c, r.routeId)!;
    const i = pendingDecision(s, c, r.uid, now);
    const home = r.returnAt <= now;
    let action = '';
    if (i !== undefined) action = `<button type="button" class="btn primary block" data-open-choice="${r.uid}">❓ ${t('ui.choice_open')}</button>`;
    else if (home) action = `<button type="button" class="btn primary block" data-unload="${r.uid}">📦 ${t('ui.unload')} · ${fmt(routeCargo(c, r))} ${ICON.coin}</button>`;
    else {
      const next = r.choices.findIndex((ch) => ch === null);
      const choiceLine = next >= 0 ? ` · ${tr('ui.choice_in', { time: `<span>${waitText(decisionDueAt(c, r, next) - now, this.host.scale())}</span>` })}` : '';
      action = `<div class="meter"><i data-progress="${r.uid}" style="width:0"></i></div><span class="muted">${t('ui.returns_in')} <b data-countdown="${r.uid}"></b>${choiceLine}</span>`;
    }
    return `<div class="active-route"><div class="top"><span class="ic">${routeIcon(def)}</span><b>${t(def.nameKey)}</b></div>${action}</div>`;
  }

  private sendCard(def: RouteDef, free: number): string {
    const s = this.host.town();
    const c = this.host.content;
    const trip = c.routes.trips.find((x) => x.id === def.trip)!;
    const missing = def.requires && !s.buildings.some((b) => b.defId === def.requires);
    const why = missing ? t('ui.needs').replace('{building}', t(c.building(def.requires!).nameKey)) : '';
    const notches = LENGTH_NOTCHES[def.trip] ?? 1;
    const length = trip.minutes < 60 ? `${trip.minutes} ${t('ui.minutes')}` : `${trip.minutes / 60} ${t('ui.hours')}`;
    const disabled = missing || free === 0 || (def.sea && s.hull.repairDoneAt !== null);
    return `<div class="rcard ${tripClass(def)} ${missing ? 'locked' : ''}">
      <div class="big">${routeIcon(def)}</div>
      <div><b>${t(def.nameKey)}</b>
        <div class="meta">${t(`ui.trip.${def.trip}`)} · ⏱ ${length} · ${def.sea ? t('ui.sea') : t('ui.land')}</div>
        <div class="meta">≈ ${fmt(routeBaseCoin(s, c, def.id))} ${ICON.coin} · ${tr('ui.choices_n', { n: def.decisions.length })}${why ? ` · 🔒 ${why}` : ''}</div>
        <div class="dur">${[1, 2, 3, 4].map((n) => `<i class="${n <= notches ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <button type="button" class="go" data-send="${def.id}" ${disabled ? 'disabled' : ''}>${t('ui.send')}</button>
    </div>`;
  }

  /** Show the choice a route is waiting on, as a card with both options and their odds. */
  openChoice(uid: number): void {
    const s = this.host.town();
    const c = this.host.content;
    const r = s.routes.find((x) => x.uid === uid);
    if (!r) return;
    const i = pendingDecision(s, c, uid, this.host.now());
    if (i === undefined) return;
    const def = routeDef(c, r.routeId)!;
    const d = def.decisions[i]!;
    const avg = (outs: OutcomeDef[]) => {
      const m = expectedCargoMult(outs);
      if (Math.abs(m - 1) < 0.005) return '';
      const pct = Math.round(Math.abs(m - 1) * 100);
      return `<p class="muted" style="margin:6px 0 0">${t('ui.expected')}: ${tr(m > 1 ? 'eff.cargo_up' : 'eff.cargo_down', { pct })}</p>`;
    };
    const opts = d.options
      .map((o) => `<button type="button" class="opt ${o.kind}" data-choose="${uid}:${o.id}">
          <span class="tag">${t(o.kind === 'safe' ? 'ui.safer' : 'ui.riskier')}</span><b>${t(o.textKey)}</b>
          <ul>${oddsText(o.outcomes).map((x) => `<li>${x}</li>`).join('')}</ul>${avg(o.outcomes)}
        </button>`)
      .join('');
    this.host.openCard(
      `<h3>${routeIcon(def)} ${t(def.nameKey)}</h3>
       <p class="muted" style="margin:0">${t('ui.choice_title')} (${i + 1}/${def.decisions.length})</p>
       <p class="quote">“${t(d.textKey)}”</p>
       <div class="opts">${opts}</div>`,
      (el) => {
        for (const b of el.querySelectorAll<HTMLButtonElement>('[data-choose]')) {
          b.addEventListener('click', () => {
            const [, opt] = b.dataset.choose!.split(':');
            const res = chooseOption(this.host.town(), c, uid, opt as 'a' | 'b', this.host.now());
            this.host.closeCard();
            if (!res.ok) return this.host.toast(this.host.errorText(res.error));
            this.host.notice(routeIcon(def), t(def.nameKey), t(res.outcome.textKey));
            this.host.changed();
            this.signature = '';
            this.update();
            // Another choice may already be waiting (a route that came home with several open).
            if (pendingDecision(this.host.town(), c, uid, this.host.now()) !== undefined) this.openChoice(uid);
          });
        }
      },
    );
  }

  /** Unload a route that is home, with a floating coin count and a banner. */
  unload(uid: number): void {
    const c = this.host.content;
    const r = this.host.town().routes.find((x) => x.uid === uid);
    const def = r ? routeDef(c, r.routeId) : undefined;
    // Open choices left unanswered take their safe default when unloading (core rule).
    const out = collectRouteSafe(this.host, uid);
    if (!out) return;
    this.host.floatAtTown(`+${fmt(out.added)} ${ICON.coin}`);
    this.host.notice('📦', t('ui.unloaded_title'), `${def ? t(def.nameKey) : ''}: +${fmt(out.added)} ${ICON.coin}`);
    this.host.changed();
    this.signature = '';
    this.update();
  }

  private bind(): void {
    const c = this.host.content;
    this.el.querySelector('#btn-routes-close')?.addEventListener('click', () => {
      this.hide();
      this.el.hidden = true;
    });
    this.el.querySelector('#btn-repair')?.addEventListener('click', () => {
      const r = repairHull(this.host.town(), c, this.host.now());
      if (!r.ok) this.host.toast(this.host.errorText(r.error));
      this.host.changed();
      this.signature = '';
      this.update();
    });
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-send]')) {
      b.addEventListener('click', () => {
        const def = routeDef(c, b.dataset.send!)!;
        const r = sendRoute(this.host.town(), c, def.id, this.host.now());
        if (!r.ok) return this.host.toast(this.host.errorText(r.error));
        const now = this.host.now();
        const scale = this.host.scale();
        this.host.notice(
          routeIcon(def),
          tr('ui.route_sent_title', { name: t(def.nameKey) }),
          `${tr('ui.back_in', { time: waitText(r.route.returnAt - now, scale) })} · ${tr('ui.choice_in', { time: waitText(decisionDueAt(c, r.route, 0) - now, scale) })}`,
        );
        this.host.changed();
        // Close the sheet so the player sees the route appear on the left of the map.
        this.hide();
        this.el.hidden = true;
      });
    }
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-open-choice]')) {
      b.addEventListener('click', () => this.openChoice(Number(b.dataset.openChoice)));
    }
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-unload]')) {
      b.addEventListener('click', () => this.unload(Number(b.dataset.unload)));
    }
  }
}

function collectRouteSafe(host: RoutesHost, uid: number): { added: number } | null {
  const r = collectRoute(host.town(), host.content, uid, host.now());
  if (!r.ok) {
    host.toast(host.errorText(r.error));
    return null;
  }
  return { added: r.deposit.added };
}
