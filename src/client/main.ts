/**
 * Grey-box client for the Pearl Coast slice. Wires the core rules to a PixiJS
 * town view and an HTML interface. No game rule lives here: every change goes
 * through src/core so the simulator, tests and a future server agree.
 */
import { Application, Assets, type Texture } from 'pixi.js';
import {
  isOpen,
  advanceRoutes,
  GameClock,
  canPlace,
  collect,
  collectAll,
  createTown,
  findBuilding,
  foodPrice,
  isMarketDay,
  loadFrom,
  registerVisit,
  sellFood,
  nextMilestone,
  outputPerHour,
  place,
  serialize,
  storageCap,
  tick,
  treasuryLimit,
  treasuryNearlyFull,
  upgrade,
  upgradeCost,
  waterCapacity,
  waterUsed,
  type ActionError,
  type TimeMode,
  type TownState,
} from '../core';
import { loadDefaultContent } from '../core/content-pack';
import { fmt, lang, setLang, t, type Lang } from './i18n';
import { browserStorage } from './storage';
import { BUILDING_ART } from './art';
import { TownView } from './town-view';
import { RoutesPanel } from './routes-panel';

const SAVE_KEY = 'aoa.slice.save.v1';
const PREFS_KEY = 'aoa.slice.prefs.v1';

interface Prefs {
  lang: Lang;
  mode: TimeMode;
}

const content = loadDefaultContent();
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(browserStorage.get(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return { lang: p.lang === 'ar' ? 'ar' : 'en', mode: p.mode === 'playtest' ? 'playtest' : 'showcase' };
  } catch {
    return { lang: 'en', mode: 'showcase' };
  }
}

const prefs = loadPrefs();
setLang(prefs.lang);
const scaleFor = (m: TimeMode) => content.balance.timeModes[m];

// --- State: restore a save or start a new town -------------------------------
let clock: GameClock;
let town: TownState;
{
  const loaded = loadFrom(browserStorage, SAVE_KEY);
  if (loaded.error) console.warn('[save] starting a new town:', loaded.error);
  if (loaded.file) {
    clock = GameClock.restore(loaded.file.clock, () => Date.now());
    clock.setScale(scaleFor(prefs.mode));
    town = loaded.file.town;
  } else {
    clock = new GameClock(() => Date.now(), scaleFor(prefs.mode));
    town = createTown(content, clock.now(), Math.floor(Math.random() * 2 ** 32));
  }
}

let version = 0; // bumps whenever the grid changes, so the view rebuilds shapes
let selected: string | null = null;
let openUid: number | null = null;
const routesPanel = new RoutesPanel($('panel'), {
  town: () => town,
  content,
  now: () => clock.now(),
  scale: () => clock.scale,
  toast,
  errorText,
  changed: () => {
    save();
    renderHud();
  },
});

function save(): void {
  browserStorage.set(SAVE_KEY, serialize(town, clock.snapshot()));
}

function savePrefs(): void {
  browserStorage.set(PREFS_KEY, JSON.stringify(prefs));
}

// --- Feedback -----------------------------------------------------------------
let toastTimer = 0;
function toast(msg: string): void {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), 2200);
}

function errorText(e: ActionError): string {
  return t(`err.${e}`);
}

// --- HTML interface -----------------------------------------------------------
function renderHud(): void {
  const r = town.resources;
  const limit = treasuryLimit(town, content);
  $('hud').innerHTML = `
    <div class="res coin" data-res="coin">${t('resource.coin')} <b>${fmt(r.coin)}</b><small>/ ${fmt(limit)}</small> <small>· ${t('ui.chest')} ${fmt(town.chest)}</small></div>
    <div class="res" data-res="water">${t('resource.water')} <b>${waterUsed(town, content)}/${waterCapacity(town, content)}</b></div>
    <div class="res" data-res="food">${t('resource.food')} <b>${fmt(r.food)}</b><small>${t('ui.food_price')} ${foodPrice(town, content, clock.now()).toFixed(2)}${isMarketDay(town, content, clock.now()) ? ` · ${t('ui.market_day')}` : ''}</small></div>
    <div class="res" data-res="knowledge">${t('resource.knowledge')} <b>${fmt(r.knowledge)}</b></div>
    <div class="res" data-res="reputation">${t('resource.reputation')} <b>${fmt(r.reputation)}</b></div>`;
  const warn = $('warn');
  const full = treasuryNearlyFull(town, content);
  warn.hidden = !full;
  if (full) warn.textContent = t('ui.treasury_warn');
}

function renderPalette(): void {
  const nav = $('palette');
  nav.innerHTML = '';
  for (const def of content.buildings) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.building = def.id;
    btn.setAttribute('aria-pressed', String(selected === def.id));
    btn.innerHTML = `${t(def.nameKey)}<span class="cost">${t('ui.cost')} ${fmt(def.placeCost)}</span>`;
    btn.addEventListener('click', () => {
      selected = selected === def.id ? null : def.id;
      closePanel();
      renderPalette();
      if (selected) toast(t('ui.select_building'));
    });
    nav.appendChild(btn);
  }
}

function renderBar(): void {
  const bar = $('bar');
  bar.innerHTML = '';
  const mk = (label: string, cls: string, onClick: () => void, id: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.id = id;
    b.textContent = label;
    b.addEventListener('click', onClick);
    bar.appendChild(b);
  };
  mk(t('ui.collect'), 'primary', () => {
    const got = collectAll(town, content, clock.now());
    const parts = (Object.keys(got) as (keyof typeof got)[]).filter((k) => got[k] > 0).map((k) => `+${fmt(got[k])} ${t(`resource.${k}`)}`);
    toast(parts.length ? parts.join('  ') : t('err.nothing_to_collect'));
    save();
  }, 'btn-collect-all');
  mk(t('ui.routes'), '', () => {
    openUid = null;
    if (routesPanel.open) {
      routesPanel.hide();
      $('panel').hidden = true;
    } else routesPanel.show();
  }, 'btn-routes');
  mk(t('ui.sell_food'), '', () => {
    const r = sellFood(town, content, town.resources.food, clock.now());
    if (!r.ok) return toast(errorText(r.error));
    toast(`${t('ui.sold')} ${fmt(r.sold)} ${t('resource.food')} · +${fmt(r.deposit.added)} ${t('resource.coin')}`);
    save();
    renderHud();
  }, 'btn-sell-food');
  mk(prefs.mode === 'showcase' ? t('ui.mode_showcase') : t('ui.mode_playtest'), '', () => {
    prefs.mode = prefs.mode === 'showcase' ? 'playtest' : 'showcase';
    tick(town, content, clock.now());
    clock.setScale(scaleFor(prefs.mode));
    savePrefs();
    renderBar();
  }, 'btn-mode');
  mk(t('ui.language'), '', () => {
    prefs.lang = lang() === 'en' ? 'ar' : 'en';
    setLang(prefs.lang);
    savePrefs();
    renderAll();
    view.layout(town);
  }, 'btn-lang');
  mk(t('ui.reset'), '', () => {
    browserStorage.remove(SAVE_KEY);
    clock = new GameClock(() => Date.now(), scaleFor(prefs.mode));
    town = createTown(content, clock.now(), Math.floor(Math.random() * 2 ** 32));
    selected = null;
    closePanel();
    version++;
    renderAll();
  }, 'btn-reset');
}

function closePanel(): void {
  openUid = null;
  routesPanel.hide();
  $('panel').hidden = true;
}

function renderPanel(): void {
  const panel = $('panel');
  if (openUid === null) return;
  const b = findBuilding(town, openUid);
  if (!b) return closePanel();
  const def = content.building(b.defId);
  const rate = outputPerHour(town, content, b);
  const cap = storageCap(town, content, b);
  const cost = upgradeCost(def, b.level, content.balance.upgradeCostGrowth);
  const ms = nextMilestone(b.level, content.balance.milestoneLevels);
  panel.innerHTML = `
    <h2>${t(def.nameKey)}</h2>
    <dl>
      <dt>${t('ui.level')}</dt><dd>${b.level}</dd>
      ${def.produces ? `<dt>${t(`resource.${def.produces}`)}</dt><dd>${fmt(rate)} ${t('ui.per_hour')}</dd>
      <dt>${t('ui.stored')}</dt><dd>${fmt(b.stored)} / ${fmt(cap)} ${b.stored >= cap ? `(${t('ui.full')})` : ''}</dd>` : ''}
      ${cost !== undefined && ms !== undefined ? `<dt>${t('ui.doubles_at')}</dt><dd>${ms}</dd>` : ''}
    </dl>
    <div class="actions">
      ${def.produces ? `<button type="button" class="primary" id="btn-collect">${t('ui.collect')}</button>` : ''}
      ${cost !== undefined ? `<button type="button" id="btn-upgrade" ${town.resources.coin < cost ? 'disabled' : ''}>${t('ui.upgrade')} · ${fmt(cost)}</button>` : ''}
      <button type="button" id="btn-close">${t('ui.close')}</button>
    </div>`;
  panel.hidden = false;
  panel.querySelector('#btn-close')?.addEventListener('click', closePanel);
  panel.querySelector('#btn-collect')?.addEventListener('click', () => {
    const r = collect(town, content, b.uid, clock.now());
    if (!r.ok) return toast(errorText(r.error));
    toast(`+${fmt(r.deposit ? r.deposit.added : r.amount)} ${t(`resource.${r.resource}`)}`);
    save();
    renderPanel();
  });
  panel.querySelector('#btn-upgrade')?.addEventListener('click', () => {
    const r = upgrade(town, content, b.uid, clock.now());
    if (!r.ok) return toast(errorText(r.error));
    version++;
    save();
    renderPanel();
  });
}

function renderAll(): void {
  renderHud();
  renderPalette();
  renderBar();
  renderPanel();
  if (routesPanel.open) routesPanel.show(); // re-render in the current language
  $('placeholder-notice').textContent = t('placeholder.notice');
}

// --- Town view ----------------------------------------------------------------
function onCellTap({ x, y }: { x: number; y: number }): void {
  if (x < 0 || y < 0 || x >= town.width || y >= town.height) return;
  if (selected) {
    const r = place(town, content, selected, x, y, clock.now());
    if (!r.ok) return toast(errorText(r.error));
    version++;
    save();
    renderHud();
    return;
  }
  const b = town.buildings.find((bb) => bb.x === x && bb.y === y);
  if (b) {
    routesPanel.hide();
    openUid = b.uid;
    renderPanel();
  } else {
    closePanel();
    if (!isOpen(town, x, y)) toast(errorText('tile_locked'));
  }
}

const app = new Application();
let view: TownView;

async function start(): Promise<void> {
  const stage = $('stage');
  renderAll(); // render the interface first so the stage has its final size
  await app.init({ resizeTo: stage, background: 0x8f8576, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
  stage.appendChild(app.canvas);
  view = new TownView(app, content, onCellTap);
  try {
    const ids = Object.keys(BUILDING_ART);
    const textures = await Promise.all(ids.map((id) => Assets.load<Texture>(BUILDING_ART[id] as string)));
    view.setBuildingArt(Object.fromEntries(ids.map((id, i) => [id, textures[i] as Texture])));
  } catch (e) {
    console.warn('[art] building art failed to load; using placeholders', e);
  }
  view.layout(town);
  // The stage can change size without a window resize (warning banner, panel, rotation).
  new ResizeObserver(() => app.resize()).observe(stage);

  let hudTimer = 0;
  app.ticker.add((tk) => {
    tick(town, content, clock.now());
    advanceRoutes(town, content, clock.now());
    view.sync(town, version);
    view.frame(town, selected, (x, y) => (selected ? canPlace(town, content, selected, x, y).ok : false));
    hudTimer += tk.deltaMS;
    if (hudTimer > 250) {
      hudTimer = 0;
      renderHud();
      if (openUid !== null) updatePanelNumbers();
      routesPanel.update();
      const rb = document.getElementById('btn-routes');
      if (rb) rb.classList.toggle('attention', routesPanel.needsAttention());
    }
  });

  app.renderer.on('resize', () => view.layout(town));
  window.setInterval(save, 5000);
  const onVisit = () => {
    if (registerVisit(town, content, clock.now()).welcomeBack) toast(t('ui.welcome_back'));
  };
  onVisit();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
    else onVisit();
  });
  // Exposed for automated tests (tests/e2e). Not a gameplay API.
  (window as unknown as { __aoa: unknown }).__aoa = {
    get town() { return town; },
    content,
    clock: () => clock,
    cellPoint: (x: number, y: number) => view.screenPointOf(x, y),
    redraw: () => { version++; view.layout(town); },
  };
}

/** Refresh numbers in the open panel without rebuilding its buttons (keeps taps reliable). */
function updatePanelNumbers(): void {
  const b = openUid !== null ? findBuilding(town, openUid) : undefined;
  if (!b) return;
  const dd = $('panel').querySelectorAll('dd');
  const def = content.building(b.defId);
  if (def.produces && dd[2]) {
    const cap = storageCap(town, content, b);
    dd[2].textContent = `${fmt(b.stored)} / ${fmt(cap)} ${b.stored >= cap ? `(${t('ui.full')})` : ''}`;
  }
}

start().catch((e) => {
  console.error('[boot] failed to start', e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#fff;padding:12px">Failed to start: ${String(e)}</pre>`);
});
