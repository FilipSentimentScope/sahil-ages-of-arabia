/**
 * Grey-box routes panel (P4-01): send routes, answer decision points, unload returned routes and
 * repair the hull. Presentation only: every change goes through src/core/routes.ts.
 *
 * The panel is rebuilt only when something the player can act on changes (a decision comes due,
 * a route comes home, the hull changes); countdowns update in place, so buttons stay tappable.
 */
import type { LoadedContent, TownState } from '../core';
import {
  chooseOption,
  collectRoute,
  freeRouteSlots,
  pendingDecision,
  repairHull,
  routeCargo,
  routeDef,
  sendRoute,
  type ActionError,
} from '../core';
import { fmt, t } from './i18n';

export interface RoutesPanelHost {
  town(): TownState;
  content: LoadedContent;
  now(): number;
  /** Game time runs this many times faster than real time (Showcase mode). */
  scale(): number;
  toast(msg: string): void;
  errorText(e: ActionError): string;
  changed(): void;
}

/** Real-time countdown text for a game-time span. */
function countdown(gameMs: number, scale: number): string {
  const s = Math.max(0, Math.ceil(gameMs / scale / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

function tripLabel(minutes: number): string {
  return minutes < 60 ? `${minutes} ${t('ui.minutes')}` : `${minutes / 60} ${t('ui.hours')}`;
}

export class RoutesPanel {
  open = false;
  private signature = '';

  constructor(
    private readonly el: HTMLElement,
    private readonly host: RoutesPanelHost,
  ) {}

  /** True when a decision is waiting or a route is home: shown as a dot on the Routes button. */
  needsAttention(): boolean {
    const s = this.host.town();
    const now = this.host.now();
    return s.routes.some((r) => r.returnAt <= now || pendingDecision(s, this.host.content, r.uid, now) !== undefined);
  }

  private stateSignature(): string {
    const s = this.host.town();
    const now = this.host.now();
    const c = this.host.content;
    const routes = s.routes.map((r) => `${r.uid}:${r.returnAt <= now ? 'home' : (pendingDecision(s, c, r.uid, now) ?? '-')}`);
    return JSON.stringify([routes, s.hull, s.resources.coin >= c.routes.hull.repairCost]);
  }

  show(): void {
    this.open = true;
    this.signature = '';
    this.update();
  }

  hide(): void {
    this.open = false;
  }

  /** Call often (every quarter second): rebuilds when needed, otherwise refreshes countdowns. */
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
      span.textContent = countdown(target - now, this.host.scale());
    }
  }

  private render(): void {
    const s = this.host.town();
    const c = this.host.content;
    const now = this.host.now();
    const out = s.routes
      .map((r) => {
        const def = routeDef(c, r.routeId)!;
        const home = r.returnAt <= now;
        const i = pendingDecision(s, c, r.uid, now);
        let body = '';
        if (home) {
          body = `<button type="button" class="primary" data-unload="${r.uid}">${t('ui.unload')} · ${fmt(routeCargo(c, r))} ${t('resource.coin')}</button>`;
        } else if (i !== undefined) {
          const d = def.decisions[i]!;
          body = `<p class="dp">${t(d.textKey)}</p><div class="actions">${d.options
            .map((o) => `<button type="button" data-choose="${r.uid}:${o.id}">${t(o.textKey)}<small>${t(`ui.${o.kind === 'safe' ? 'safer' : 'riskier'}`)}</small></button>`)
            .join('')}</div>`;
        } else {
          body = `<p class="muted">${t('ui.returns_in')} <span data-countdown="${r.uid}"></span></p>`;
        }
        return `<li><b>${t(def.nameKey)}</b>${body}</li>`;
      })
      .join('');
    const hull = s.hull.repairDoneAt !== null
      ? `<p class="muted">${t('ui.repairing')} <span data-countdown="0"></span></p>`
      : s.hull.damaged
        ? `<p class="warn">${t('ui.hull_damaged')}</p><button type="button" id="btn-repair" ${s.resources.coin < c.routes.hull.repairCost ? 'disabled' : ''}>${t('ui.repair')} · ${fmt(c.routes.hull.repairCost)}</button>`
        : '';
    const free = freeRouteSlots(s, c);
    const send = c.routes.routes
      .map((def) => {
        const trip = c.routes.trips.find((x) => x.id === def.trip)!;
        const missing = def.requires && !s.buildings.some((b) => b.defId === def.requires);
        const why = missing ? t('ui.needs').replace('{building}', t(c.building(def.requires!).nameKey)) : '';
        return `<li class="send"><span><b>${t(def.nameKey)}</b><small>${tripLabel(trip.minutes)} · ${t('ui.about')} ${fmt(trip.baseCoin)} ${t('resource.coin')}${why ? ` · ${why}` : ''}</small></span>
          <button type="button" data-send="${def.id}" ${missing || free === 0 ? 'disabled' : ''}>${t('ui.send')}</button></li>`;
      })
      .join('');
    this.el.innerHTML = `
      <h2>${t('ui.routes')} <small>${s.routes.length} / ${c.routes.slots} ${t('ui.routes_out')}</small></h2>
      ${hull}
      ${out ? `<ul class="routes">${out}</ul>` : ''}
      <ul class="routes">${send}</ul>
      <div class="actions"><button type="button" id="btn-routes-close">${t('ui.close')}</button></div>`;
    this.el.hidden = false;
    this.bind();
  }

  private act(r: { ok: true } | { ok: false; error: ActionError }, okMsg?: () => string): void {
    if (!r.ok) {
      this.host.toast(this.host.errorText(r.error));
    } else if (okMsg) {
      this.host.toast(okMsg());
    }
    this.host.changed();
    this.signature = '';
    this.update();
  }

  private bind(): void {
    const { content: c } = this.host;
    this.el.querySelector('#btn-routes-close')?.addEventListener('click', () => {
      this.hide();
      this.el.hidden = true;
    });
    this.el.querySelector('#btn-repair')?.addEventListener('click', () => this.act(repairHull(this.host.town(), c, this.host.now())));
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-send]')) {
      b.addEventListener('click', () => this.act(sendRoute(this.host.town(), c, b.dataset.send!, this.host.now()), () => t('ui.route_sent')));
    }
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-choose]')) {
      b.addEventListener('click', () => {
        const [uid, opt] = b.dataset.choose!.split(':');
        const r = chooseOption(this.host.town(), c, Number(uid), opt as 'a' | 'b', this.host.now());
        this.act(r, () => (r.ok ? t(r.outcome.textKey) : ''));
      });
    }
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('[data-unload]')) {
      b.addEventListener('click', () => {
        const r = collectRoute(this.host.town(), c, Number(b.dataset.unload), this.host.now());
        this.act(r, () => (r.ok ? `+${fmt(r.deposit.added)} ${t('resource.coin')}` : ''));
      });
    }
  }
}
