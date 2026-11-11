/**
 * Client for the Pearl Coast slice (interface v2, 2 Nov 2026, after Filip's first playtest).
 *
 * The map fills the screen in any shape; the interface floats over it:
 * - top: resources with icons (tap food to sell it), the age's goals, a menu;
 * - right: round action buttons with badges (Build, Routes, Goals, Collect);
 * - left: a timer for every route that is out;
 * - bottom: one suggested next step, always;
 * - sheets slide up on phones and sit at the side on wide screens;
 * - the Rawi guides the first session as an advisor.
 *
 * No game rule lives here: every change goes through src/core.
 */
import '@fontsource/el-messiri/500.css';
import '@fontsource/el-messiri/700.css';
import { Application, Assets, type Texture } from 'pixi.js';
import {
  GameClock,
  ageProgress,
  nextQuestion,
  questionsLeftToday,
  advanceGifts,
  advanceRoutes,
  claimTask,
  claimableTasks,
  collectGift,
  taskProgress,
  townRank,
  canPlace,
  collect,
  collectAll,
  createTown,
  findBuilding,
  foodPrice,
  isMarketDay,
  isOpen,
  loadFrom,
  outputPerHour,
  pendingDecision,
  place,
  quoteFoodSale,
  registerVisit,
  routeDef,
  sellFood,
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
import { AgePanel } from './age-panel';
import { BUILDING_ART } from './art';
import { Sound } from './audio';
import { ICON, buildingFacts, provides, tr, waitText } from './describe';
import { Encyclopedia } from './encyclopedia';
import { icon, installIconSwap, rawiAvatar } from './icons';
import { suggest, type Suggestion } from './guide';
import { fmt, lang, setLang, t, type Lang } from './i18n';
import { RoutesPanel, routeIcon } from './routes-panel';
import { openArchive, openQuestion, type QuestionsHost } from './questions-ui';
import { browserStorage } from './storage';
import { TownView } from './town-view';
import { STEPS, currentStep } from './tutorial';

const SAVE_KEY = 'aoa.slice.save.v1';
const PREFS_KEY = 'aoa.slice.prefs.v1';

interface Prefs {
  lang: Lang;
  mode: TimeMode;
  voice: boolean;
  music: boolean;
  /** Tutorial step reached, or -1 when finished or skipped. */
  tutorial: number;
}

const content = loadDefaultContent();
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(browserStorage.get(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return {
      lang: p.lang === 'ar' ? 'ar' : 'en',
      mode: p.mode === 'playtest' ? 'playtest' : 'showcase',
      voice: p.voice !== false,
      music: p.music !== false,
      tutorial: typeof p.tutorial === 'number' ? p.tutorial : 0,
    };
  } catch {
    return { lang: 'en', mode: 'showcase', voice: true, music: true, tutorial: 0 };
  }
}

const prefs = loadPrefs();
setLang(prefs.lang);
const scaleFor = (m: TimeMode) => content.balance.timeModes[m];
const sound = new Sound(prefs.voice, prefs.music);

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

let version = 0; // bumps whenever the board changes, so the view rebuilds shapes
let placing: string | null = null;
let openUid: number | null = null;
let sheetKind: 'build' | 'building' | 'routes' | 'goals' | 'menu' | 'encyclopedia' | 'tasks' | null = null;
let goalsSeen = false;
let view: TownView;
const wait = (gameMs: number) => waitText(gameMs, clock.scale);

function save(): void {
  browserStorage.set(SAVE_KEY, serialize(town, clock.snapshot()));
}

function savePrefs(): void {
  browserStorage.set(PREFS_KEY, JSON.stringify(prefs));
}

function errorText(e: ActionError): string {
  return t(`err.${e}`);
}

// --- Feedback: errors, banners, cards -----------------------------------------
let toastTimer = 0;
function toast(msg: string): void {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), 2600);
}

let noticeTimer = 0;
/** A short banner after an action: what happened and what comes next. */
function notice(icon: string, title: string, line: string): void {
  const el = $('notice');
  el.innerHTML = `<span class="ic">${icon}</span><div><b>${title}</b><span>${line}</span></div>`;
  el.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => (el.hidden = true), 4200);
}

function openCard(html: string, bind: (el: HTMLElement) => void): void {
  const el = $('card');
  el.innerHTML = html;
  el.hidden = false;
  $('scrim').hidden = false;
  bind(el);
}

function closeCard(): void {
  $('card').hidden = true;
  $('scrim').hidden = true;
}

function changed(): void {
  version++;
  save();
  refreshNow();
}

// --- Sheets ---------------------------------------------------------------------
const sheet = $('sheet');
const routesPanel = new RoutesPanel(sheet, {
  town: () => town,
  content,
  now: () => clock.now(),
  scale: () => clock.scale,
  toast,
  errorText,
  notice,
  openCard,
  closeCard,
  floatAtTown: (text) => {
    const jetty = town.buildings.find((b) => b.defId === 'jetty') ?? town.buildings[0];
    if (jetty) view.float(jetty.x, jetty.y, text);
  },
  changed,
});
const questionsHost: QuestionsHost = {
  town: () => town,
  content,
  now: () => clock.now(),
  toast,
  errorText,
  openCard,
  closeCard,
  changed,
};
const agePanel = new AgePanel(sheet, {
  town: () => town,
  content,
  now: () => clock.now(),
  toast,
  notice,
  errorText,
  changed,
  openQuestion: () => openQuestion(questionsHost),
  openArchive: () => openArchive(questionsHost),
});

const encyclopedia = new Encyclopedia(sheet, content, () => town, () => closeSheet());

function openEncyclopedia(entryId?: string): void {
  closeSheet();
  sheetKind = 'encyclopedia';
  encyclopedia.show(entryId);
}

function closeSheet(): void {
  sheetKind = null;
  openUid = null;
  view?.select(null);
  routesPanel.hide();
  agePanel.hide();
  sheet.hidden = true;
}

function openSheet(kind: NonNullable<typeof sheetKind>): void {
  closeSheet();
  sheetKind = kind;
  if (kind === 'routes') return routesPanel.show();
  if (kind === 'goals') {
    goalsSeen = true;
    return agePanel.show();
  }
  if (kind === 'build') return renderBuildSheet();
  if (kind === 'menu') return renderMenu();
  if (kind === 'tasks') return renderTasksSheet();
}

function sheetHead(title: string): string {
  return `<div class="sheet-head"><h2>${title}</h2><button type="button" class="x" id="btn-close" aria-label="${t('ui.close')}">✕</button></div>`;
}

function bindClose(): void {
  sheet.querySelector('#btn-close')?.addEventListener('click', closeSheet);
}

/** Why a building cannot be built now, or '' if it can somewhere. */
function lockReason(defId: string): string {
  const def = content.building(defId);
  if (def.maxCount !== undefined && town.buildings.filter((b) => b.defId === defId).length >= def.maxCount) return t('ui.locked_reason.max');
  if (town.resources.coin < def.placeCost) return tr('ui.locked_reason.coin', { cost: fmt(def.placeCost) });
  if (def.waterUse > 0 && waterUsed(town, content) + def.waterUse > waterCapacity(town, content)) return t('ui.locked_reason.water');
  for (let y = 0; y < town.height; y++) for (let x = 0; x < town.width; x++) if (canPlace(town, content, defId, x, y).ok) return '';
  return t('ui.locked_reason.place');
}

function renderBuildSheet(): void {
  const cards = content.buildings
    .map((def) => {
      const why = lockReason(def.id);
      return `<button type="button" class="bcard ${why ? 'locked' : ''}" data-building="${def.id}">
        <img src="${BUILDING_ART[def.id] ?? ''}" alt="" />
        <b>${t(def.nameKey)}</b>
        <span class="cost">${fmt(def.placeCost)} ${ICON.coin}</span>
        <span class="prov">${provides(def, content).map((x) => `<i>${x}</i>`).join('')}</span>
        <span class="what">${t(`desc.${def.id}`)}</span>
        ${why ? `<span class="why">${why}</span>` : ''}
      </button>`;
    })
    .join('');
  sheet.innerHTML = `${sheetHead(`🔨 ${t('ui.choose_building')}`)}<div class="cards">${cards}</div>`;
  sheet.hidden = false;
  bindClose();
  for (const b of sheet.querySelectorAll<HTMLButtonElement>('[data-building]')) {
    b.addEventListener('click', () => {
      const id = b.dataset.building!;
      const why = lockReason(id);
      if (why) return toast(why);
      startPlacing(id);
    });
  }
}

function startPlacing(defId: string): void {
  closeSheet();
  placing = defId;
  const bar = $('placebar');
  bar.innerHTML = `<span>${tr('ui.place_hint', { name: t(content.building(defId).nameKey) })}</span><button type="button" id="btn-cancel-place">${t('ui.cancel')}</button>`;
  bar.hidden = false;
  bar.querySelector('#btn-cancel-place')?.addEventListener('click', stopPlacing);
}

function stopPlacing(): void {
  placing = null;
  $('placebar').hidden = true;
}

function renderBuildingSheet(): void {
  const b = openUid !== null ? findBuilding(town, openUid) : undefined;
  if (!b) return closeSheet();
  const def = content.building(b.defId);
  const rate = outputPerHour(town, content, b);
  const cap = storageCap(town, content, b);
  const cost = upgradeCost(def, b.level, content.balance.upgradeCostGrowth);
  let gain = 0;
  if (cost !== undefined && def.produces) {
    b.level += 1; // look ahead only; restored on the next line (no rule changes here)
    gain = outputPerHour(town, content, b) - rate;
    b.level -= 1;
  }
  const icon = def.produces ? ICON[def.produces] : '';
  const share = cap > 0 ? Math.min(1, b.stored / cap) : 0;
  const fullIn = rate > 0 && b.stored < cap ? tr('ui.full_in', { time: wait(((cap - b.stored) / rate) * 3_600_000) }) : t('ui.is_full');
  sheet.innerHTML = `
    ${sheetHead(`${t(def.nameKey)} <small>${tr('ui.level_n', { n: b.level })}</small>`)}
    <div class="binfo"><img src="${BUILDING_ART[def.id] ?? ''}" alt="" />
      <div><p style="margin:0 0 6px">${t(`desc.${def.id}`)}</p><ul class="facts">${buildingFacts(def, content).map((f) => `<li>${f}</li>`).join('')}</ul></div></div>
    ${def.produces ? `
      <div class="stat"><span>${t('ui.per_hour')}</span><b>${fmt(rate)} ${icon}</b></div>
      <div class="stat"><span>${t('ui.stored')}</span><b data-stored>${fmt(b.stored)} / ${fmt(cap)} ${icon}</b></div>
      <div class="meter"><i data-stored-bar style="width:${share * 100}%"></i></div>
      <p class="muted" data-full-in style="margin:0 0 10px">${fullIn}</p>` : ''}
    <button type="button" class="btn block" id="btn-read-more" style="margin-bottom:8px">📚 ${t('ui.read_more')}</button>
    <div class="row">
      ${def.produces ? `<button type="button" class="btn primary" id="btn-collect">🧺 ${t('ui.collect')}</button>` : ''}
      ${cost !== undefined ? `<button type="button" class="btn" id="btn-upgrade" ${town.resources.coin < cost ? 'disabled' : ''}>⬆️ ${def.produces ? tr('ui.upgrade_gain', { cost: fmt(cost), gain: fmt(gain), icon }) : `${t('ui.upgrade')} · ${fmt(cost)} ${ICON.coin}`}</button>` : ''}
    </div>`;
  sheet.hidden = false;
  bindClose();
  sheet.querySelector('#btn-read-more')?.addEventListener('click', () => openEncyclopedia(`bld_${def.id}`));
  sheet.querySelector('#btn-collect')?.addEventListener('click', () => {
    const r = collect(town, content, b.uid, clock.now());
    if (!r.ok) return toast(errorText(r.error));
    view.float(b.x, b.y, `+${fmt(r.deposit ? r.deposit.added : r.amount)} ${ICON[r.resource]}`);
    const at = plotOnScreen(b.x, b.y);
    fly(r.resource, at.x, at.y - 30, 4);
    save();
    renderBuildingSheet();
  });
  sheet.querySelector('#btn-upgrade')?.addEventListener('click', () => {
    const r = upgrade(town, content, b.uid, clock.now());
    if (!r.ok) return toast(errorText(r.error));
    view.float(b.x, b.y, `⬆️ ${tr('ui.level_n', { n: r.building.level })}`);
    view.pop(b.uid);
    changed();
    renderBuildingSheet();
  });
}

function renderMenu(): void {
  const onOff = (v: boolean) => (v ? t('ui.on') : t('ui.off'));
  sheet.innerHTML = `${sheetHead(`☰ ${t('ui.menu')}`)}
    <div class="menu-list">
      <button type="button" class="btn" id="btn-lang"><span>🌐 ${lang() === 'en' ? 'العربية' : 'English'}</span><span></span></button>
      <button type="button" class="btn" id="btn-mode"><span>⏱ ${t('ui.time_speed')}</span><b>${prefs.mode === 'showcase' ? t('ui.mode_showcase') : t('ui.mode_playtest')}</b></button>
      <button type="button" class="btn" id="btn-voice"><span>🗣 ${t('ui.sound_voice')}</span><b>${onOff(prefs.voice)}</b></button>
      <button type="button" class="btn" id="btn-music"><span>🎵 ${t('ui.sound_music')}</span><b>${onOff(prefs.music)}</b></button>
      <button type="button" class="btn" id="btn-tutorial"><span>🧭 ${t('ui.restart_tutorial')}</span><span></span></button>
      <button type="button" class="btn" id="btn-reset"><span>🏝 ${t('ui.reset')}</span><span></span></button>
      <p class="muted" style="font-size:12px">${t('placeholder.notice')}</p>
    </div>`;
  sheet.hidden = false;
  bindClose();
  const on = (id: string, f: () => void) => sheet.querySelector(`#${id}`)?.addEventListener('click', f);
  on('btn-lang', () => {
    prefs.lang = lang() === 'en' ? 'ar' : 'en';
    setLang(prefs.lang);
    savePrefs();
    version++;
    buildChrome();
    renderMenu();
  });
  on('btn-mode', () => {
    prefs.mode = prefs.mode === 'showcase' ? 'playtest' : 'showcase';
    tick(town, content, clock.now());
    clock.setScale(scaleFor(prefs.mode));
    savePrefs();
    renderMenu();
  });
  on('btn-voice', () => {
    prefs.voice = !prefs.voice;
    sound.setVoice(prefs.voice);
    savePrefs();
    renderMenu();
  });
  on('btn-music', () => {
    prefs.music = !prefs.music;
    sound.setMusic(prefs.music);
    savePrefs();
    renderMenu();
  });
  on('btn-tutorial', () => {
    prefs.tutorial = 0;
    shownStep = -1;
    savePrefs();
    closeSheet();
  });
  let armed = false;
  on('btn-reset', () => {
    // Two taps, so a stray tap never throws a town away.
    if (!armed) {
      armed = true;
      toast(t('ui.reset_confirm'));
      return;
    }
    browserStorage.remove(SAVE_KEY);
    clock = new GameClock(() => Date.now(), scaleFor(prefs.mode));
    town = createTown(content, clock.now(), Math.floor(Math.random() * 2 ** 32));
    prefs.tutorial = 0;
    shownStep = -1;
    savePrefs();
    stopPlacing();
    closeSheet();
    version++;
    view.layout(town);
    refreshNow();
  });
}

// --- Selling food: tap the food chip -----------------------------------------
function openSellCard(): void {
  const food = Math.floor(town.resources.food);
  const quote = quoteFoodSale(town, content, food, clock.now());
  openCard(
    `<h3>🍞 ${t('ui.sell_food')}</h3>
     <p>${t('ui.food_price')}: <b>${foodPrice(town, content, clock.now()).toFixed(2)} ${ICON.coin}</b>${isMarketDay(town, content, clock.now()) ? ` · ${t('ui.market_day')}` : ''}</p>
     <p>${fmt(food)} ${ICON.food} → <b>${fmt(quote)} ${ICON.coin}</b></p>
     <p class="muted">${t('ui.sell_help')}</p>
     <div class="row"><button type="button" class="btn" id="btn-sell-cancel">${t('ui.cancel')}</button>
     <button type="button" class="btn primary" id="btn-sell-food" ${food < 1 ? 'disabled' : ''}>${t('ui.sell_food')}</button></div>`,
    (el) => {
      el.querySelector('#btn-sell-cancel')?.addEventListener('click', closeCard);
      el.querySelector('#btn-sell-food')?.addEventListener('click', () => {
        closeCard();
        doSell();
      });
    },
  );
}

function doSell(): void {
  const r = sellFood(town, content, town.resources.food, clock.now());
  if (!r.ok) return toast(errorText(r.error));
  notice('🍞', `${t('ui.sold')} ${fmt(r.sold)} ${ICON.food}`, `+${fmt(r.deposit.added)} ${ICON.coin}`);
  save();
  refreshNow();
}

function doCollectAll(): void {
  const now = clock.now();
  // Float a number over every building that gave something.
  const before = new Map(town.buildings.map((b) => [b.uid, Math.floor(b.stored)]));
  const got = collectAll(town, content, now);
  for (const b of town.buildings) {
    const def = content.building(b.defId);
    const had = before.get(b.uid) ?? 0;
    if (def.produces && had >= 1) view.float(b.x, b.y, `+${fmt(had)} ${ICON[def.produces]}`);
  }
  const parts = (Object.keys(got) as (keyof typeof got)[]).filter((k) => got[k] > 0).map((k) => `+${fmt(got[k])} ${ICON[k]}`);
  if (!parts.length) toast(t('err.nothing_to_collect'));
  save();
  refreshNow();
}

// --- Persistent chrome: resource chips, dock, goals pill --------------------------
interface Chips {
  coin: HTMLElement;
  water: HTMLElement;
  food: HTMLElement;
  knowledge: HTMLElement;
  reputation: HTMLElement;
  question: HTMLElement;
}
let chips: Chips;
const dock: Record<string, HTMLButtonElement> = {};

function buildChrome(): void {
  const res = $('res');
  res.innerHTML = '';
  const chip = (id: string, tap?: () => void) => {
    const el = document.createElement(tap ? 'button' : 'div');
    el.className = `chip${tap ? ' tap' : ''}`;
    el.id = `chip-${id}`;
    if (tap) {
      (el as HTMLButtonElement).type = 'button';
      el.addEventListener('click', tap);
    }
    res.appendChild(el);
    return el;
  };
  chips = {
    coin: chip('coin', () => rawiSay(t('rawi.coin'))),
    water: chip('water', () => rawiSay(t('rawi.water'))),
    food: chip('food', openSellCard),
    knowledge: chip('knowledge', () => rawiSay(t('rawi.knowledge'))),
    reputation: chip('reputation', () => rawiSay(t('rawi.reputation'))),
    question: chip('question', () => openQuestion(questionsHost)),
  };
  $('btn-menu').onclick = () => (sheetKind === 'menu' ? closeSheet() : openSheet('menu'));
  $('btn-goals').onclick = () => (sheetKind === 'goals' ? closeSheet() : openSheet('goals'));
  $('btn-recenter').onclick = () => view.layout(town);
  $('btn-recenter').title = t('ui.recenter');
  const d = $('dock');
  d.innerHTML = '';
  const mk = (id: string, glyph: string, label: string, onClick: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'round';
    b.id = id;
    b.innerHTML = `${glyph}<span class="lbl">${label}</span>`;
    b.addEventListener('click', onClick);
    d.appendChild(b);
    dock[id] = b;
  };
  mk('btn-build', icon('build', 'ico dock'), t('ui.build'), () => (sheetKind === 'build' ? closeSheet() : openSheet('build')));
  mk('btn-routes', icon('routes', 'ico dock'), t('ui.routes'), () => (sheetKind === 'routes' ? closeSheet() : openSheet('routes')));
  mk('btn-collect-all', icon('collect', 'ico dock'), t('ui.collect_all'), doCollectAll);
  mk('btn-tasks', icon('tasks', 'ico dock'), t('ui.tasks'), () => (sheetKind === 'tasks' ? closeSheet() : openSheet('tasks')));
  mk('btn-encyclopedia', icon('book', 'ico dock'), t('ui.encyclopedia_short'), () => (sheetKind === 'encyclopedia' ? closeSheet() : openEncyclopedia()));
  $('btn-menu').innerHTML = icon('menu', 'ico dock');
  $('btn-recenter').innerHTML = icon('target', 'ico dock');
  $('placeholder-notice').textContent = t('placeholder.notice');
  lastTask = '';
  trackerSig = '';
  refreshNow();
}

function setBadge(btn: HTMLButtonElement | undefined, n: number): void {
  if (!btn) return;
  let badge = btn.querySelector<HTMLElement>('.badge');
  if (n <= 0) return badge?.remove();
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'badge';
    btn.appendChild(badge);
  }
  badge.textContent = String(n);
}

/** Set HTML only when it changed, so the page is not rebuilt four times a second. */
function setHTML(el: HTMLElement, html: string): void {
  if (el.dataset.h === html) return;
  el.dataset.h = html;
  el.innerHTML = html;
}

/** Icons fly from a point on screen to a target (a resource chip): the reward is seen arriving. */
function fly(name: 'coin' | 'food' | 'knowledge' | 'reputation', fromX: number, fromY: number, n = 5): void {
  const target = document.getElementById(`chip-${name}`)?.getBoundingClientRect();
  if (!target) return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'fly';
    el.innerHTML = icon(name);
    el.style.left = `${fromX + (Math.random() - 0.5) * 30}px`;
    el.style.top = `${fromY + (Math.random() - 0.5) * 30}px`;
    document.body.appendChild(el);
    window.setTimeout(() => {
      el.style.left = `${target.left + 6}px`;
      el.style.top = `${target.top + 3}px`;
      el.style.opacity = '0.2';
      el.style.transform = 'scale(0.6)';
    }, 30 + i * 70);
    window.setTimeout(() => {
      el.remove();
      const chip = document.getElementById(`chip-${name}`);
      chip?.classList.remove('bump');
      void chip?.offsetWidth;
      chip?.classList.add('bump');
    }, 700 + i * 70);
  }
}

function plotOnScreen(x: number, y: number): { x: number; y: number } {
  const r = $('stage').getBoundingClientRect();
  const p = view.screenPointOf(x, y);
  return { x: r.left + p.x, y: r.top + p.y };
}

function screenCentre(): { x: number; y: number } {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** A full-screen moment for a new rank. */
function celebrateRank(rankId: string, land: boolean): void {
  const bits = Array.from({ length: 28 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 7) * 0.12}s;background:${['#e2b85c', '#1f7a83', '#b3402a', '#fff6dc'][i % 4]}"></i>`).join('');
  openCard(
    `<div class="confetti">${bits}</div><div class="rank-up">${icon('tasks', 'ico huge')}<p class="muted">${t('ui.tasks')}</p><h3>${tr('ui.rank_up', { rank: t(`rank.${rankId}`) })}</h3>${land ? `<p>🗺 ${t('ui.land_opened')}</p>` : ''}
     <button type="button" class="btn primary block" id="btn-rank-ok">${t('ui.ok')}</button></div>`,
    (el) => el.querySelector('#btn-rank-ok')?.addEventListener('click', closeCard),
  );
}

function renderTasksSheet(): void {
  const qLeft = nextQuestion(town, content) ? questionsLeftToday(town, content, clock.now()) : 0;
  const chron = ageProgress(town, content, clock.now()).chronicle;
  chips.question.hidden = qLeft <= 0;
  chips.question.classList.toggle('attn', qLeft > 0 && chron.done < chron.of);
  chips.question.title = t('ui.question_title');
  setHTML(chips.question, `${icon('book')}${qLeft}`);
  nudges();
  const rank = townRank(town, content);
  const rows = content.tasks.tasks
    .map((task) => ({ task, p: taskProgress(town, content, task) }))
    .sort((a, b) => Number(a.p.claimed) - Number(b.p.claimed) || Number(b.p.done) - Number(a.p.done))
    .map(({ task, p }) => {
      const reward = `${task.reward.coin ? `+${fmt(task.reward.coin)} ${ICON.coin}` : ''}${task.reward.knowledge ? `+${fmt(task.reward.knowledge)} ${ICON.knowledge}` : ''}`;
      const action = p.claimed
        ? `<span class="done">✓ ${t('ui.claimed')}</span>`
        : p.done
          ? `<button type="button" class="btn primary claim" data-claim="${task.id}">${t('ui.claim')} ${reward}</button>`
          : `<span class="reward">${reward}</span>`;
      return `<div class="task ${p.claimed ? 'claimed' : p.done ? 'ready' : ''}"><div><b>${t(`task.${task.id}`)}</b>
        <div class="meter"><i style="width:${(100 * p.have) / p.need}%"></i></div><small>${fmt(p.have)} / ${fmt(p.need)}</small></div>${action}</div>`;
    })
    .join('');
  sheet.innerHTML = `${sheetHead(`${icon('tasks')} ${t('ui.tasks')}`)}
    <div class="rank-card">${icon('tasks', 'ico big')}<div><b>${t(`rank.${rank.id}`)}</b>
      <small>${rank.next ? tr('ui.rank_next', { n: rank.next.tasksLeft, rank: t(`rank.${rank.next.id}`) }) : t('ui.rank_top')}</small></div></div>
    <div class="tasks">${rows}</div>`;
  sheet.hidden = false;
  bindClose();
  for (const b of sheet.querySelectorAll<HTMLButtonElement>('[data-claim]')) {
    b.addEventListener('click', () => {
      const r = claimTask(town, content, b.dataset.claim!, clock.now());
      if (!r.ok) return toast(errorText(r.error));
      const box = b.getBoundingClientRect();
      fly(r.knowledge ? 'knowledge' : 'coin', box.left + box.width / 2, box.top, 7);
      changed();
      renderTasksSheet();
      if (r.landOpened > 0) view.layout(town);
      if (r.rankUp) celebrateRank(r.rankUp, r.landOpened > 0);
    });
  }
}

function renderChips(): void {
  const r = town.resources;
  const limit = treasuryLimit(town, content);
  const fill = Math.min(1, r.coin / Math.max(1, limit));
  setHTML(chips.coin, `${icon('coin')}${fmt(r.coin)}<span class="bar"><i style="width:${fill * 100}%"></i></span>`);
  chips.coin.classList.toggle('full', treasuryNearlyFull(town, content));
  chips.coin.title = `${t('resource.coin')} · ${fmt(r.coin)} / ${fmt(limit)}`;
  const wu = waterUsed(town, content);
  const wc = waterCapacity(town, content);
  setHTML(chips.water, `${icon('water')}${wc - wu}<small>${t('ui.free')}</small>`);
  chips.water.classList.toggle('full', wc > 0 && wu >= wc);
  chips.water.title = t('resource.water');
  setHTML(chips.food, `${icon('food')}${fmt(r.food)}<small>@${foodPrice(town, content, clock.now()).toFixed(2)}</small>`);
  chips.food.title = `${t('resource.food')} · ${t('ui.sell_food')}`;
  setHTML(chips.knowledge, `${icon('knowledge')}${fmt(r.knowledge)}`);
  chips.knowledge.title = t('resource.knowledge');
  setHTML(chips.reputation, `${icon('reputation')}${fmt(r.reputation)}`);
  chips.reputation.title = t('resource.reputation');
  const rank = townRank(town, content);
  setHTML($('btn-goals'), `<span class="rank">${icon('tasks')}<b>${t(`rank.${rank.id}`)}</b></span><span class="g">${agePanel.summary()}</span>`);
  setBadge(dock['btn-tasks'], claimableTasks(town, content).length);
  const warn = $('warn');
  warn.hidden = !treasuryNearlyFull(town, content);
  if (!warn.hidden) warn.textContent = t('ui.treasury_warn');
  // Badges: routes waiting on the player, buildings with full stores.
  setBadge(dock['btn-routes'], routesPanel.needsAttention());
  const full = town.buildings.filter((b) => {
    const cap = storageCap(town, content, b);
    return cap > 0 && b.stored >= cap;
  }).length;
  setBadge(dock['btn-collect-all'], full);
}

// --- Route timers on the left ------------------------------------------------------
let trackerSig = '';
function renderTrackers(): void {
  const now = clock.now();
  const sig = JSON.stringify(town.routes.map((r) => [r.uid, r.returnAt <= now, pendingDecision(town, content, r.uid, now) !== undefined]));
  const box = $('trackers');
  if (sig !== trackerSig) {
    trackerSig = sig;
    box.innerHTML = '';
    for (const r of town.routes) {
      const def = routeDef(content, r.routeId);
      if (!def) continue;
      const pending = pendingDecision(town, content, r.uid, now) !== undefined;
      const home = r.returnAt <= now;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `tracker${pending ? ' pending' : home ? ' home' : ''}`;
      b.dataset.uid = String(r.uid);
      b.innerHTML = `<span class="ic">${routeIcon(def)}</span><span class="tx">${pending ? '❓' : home ? '📦' : ''}</span><i class="prog"></i>`;
      b.addEventListener('click', () => {
        const n = clock.now();
        if (pendingDecision(town, content, r.uid, n) !== undefined) routesPanel.openChoice(r.uid);
        else if (r.returnAt <= n) routesPanel.unload(r.uid);
        else openSheet('routes');
      });
      box.appendChild(b);
    }
  }
  for (const b of box.querySelectorAll<HTMLElement>('.tracker')) {
    const r = town.routes.find((x) => x.uid === Number(b.dataset.uid));
    if (!r) continue;
    const tx = b.querySelector<HTMLElement>('.tx')!;
    if (!b.classList.contains('pending') && !b.classList.contains('home')) tx.textContent = wait(r.returnAt - now);
    const prog = b.querySelector<HTMLElement>('.prog')!;
    prog.style.width = `${Math.min(100, (100 * (now - r.departedAt)) / Math.max(1, r.returnAt - r.departedAt))}%`;
  }
}

// --- Next step bar -----------------------------------------------------------------
let lastTask = '';
let currentSuggestion: Suggestion | null = null;
function renderTaskbar(): void {
  const bar = $('taskbar');
  const tutorialOn = prefs.tutorial >= 0 && prefs.tutorial < STEPS.length;
  bar.hidden = tutorialOn;
  if (tutorialOn) return;
  const s = suggest(town, content, clock.now(), wait);
  currentSuggestion = s;
  const key = `${s.icon}|${s.text}|${s.go}`;
  if (key === lastTask) return;
  const fresh = lastTask !== '' && !s.text.startsWith(lastTask.split('|')[1]?.slice(0, 12) ?? '');
  lastTask = key;
  bar.innerHTML = `<span class="ic">${s.icon}</span><span class="txt">${s.text}</span>${s.go ? `<button type="button" id="btn-task">${s.go}</button>` : ''}`;
  bar.querySelector('#btn-task')?.addEventListener('click', () => currentSuggestion && runSuggestion(currentSuggestion));
  if (fresh) {
    bar.classList.remove('changed');
    void bar.offsetWidth;
    bar.classList.add('changed');
  }
}

function runSuggestion(s: Suggestion): void {
  const a = s.action;
  if (a.kind === 'build') {
    if (lockReason(a.defId)) return openSheet('build');
    return startPlacing(a.defId);
  }
  if (a.kind === 'collect') return doCollectAll();
  if (a.kind === 'sell') return openSellCard();
  if (a.kind === 'decide') return routesPanel.openChoice(a.uid);
  if (a.kind === 'unload') return routesPanel.unload(a.uid);
  if (a.kind === 'routes') return openSheet('routes');
  if (a.kind === 'goals') return openSheet('goals');
  if (a.kind === 'tasks') return openSheet('tasks');
  if (a.kind === 'question') return openQuestion(questionsHost);
  if (a.kind === 'open') return openBuilding(a.uid);
}

function openBuilding(uid: number): void {
  closeSheet();
  openUid = uid;
  sheetKind = 'building';
  view.select(uid);
  renderBuildingSheet();
}

// --- Rawi, the advisor ------------------------------------------------------------
let shownStep = -1;
function renderTutorial(): void {
  const box = $('rawi');
  $('app').classList.toggle('sheet-open', !sheet.hidden);
  if (prefs.tutorial < 0) {
    if (!box.classList.contains('tip')) box.hidden = true;
    clearGlow();
    return;
  }
  const idx = currentStep(prefs.tutorial, { town, content, now: clock.now(), goalsSeen });
  if (idx !== prefs.tutorial) {
    prefs.tutorial = idx;
    savePrefs();
  }
  if (idx >= STEPS.length) {
    prefs.tutorial = -1;
    savePrefs();
    box.hidden = true;
    clearGlow();
    lastQuestionNudge = Date.now();
    return;
  }
  const step = STEPS[idx]!;
  // Glow on whichever target is on screen now (the button, then the card in the sheet).
  clearGlow();
  for (const sel of step.highlight) document.querySelectorAll(sel).forEach((el) => el.classList.add('tut-glow'));
  if (idx === shownStep) return;
  shownStep = idx;
  const info = !step.done;
  box.classList.remove('tip');
  box.innerHTML = `<div class="rawi-face">${rawiAvatar()}</div><div>
      <p class="who">${t('ui.rawi_name')} <span>${idx + 1}/${STEPS.length}</span></p>
      ${step.quote ? `<p class="q">“${t(step.quote)}”</p>` : ''}
      <p class="d">${t(step.text)}</p>
      <div class="row"><button type="button" class="btn" id="btn-tut-skip">${t('ui.skip_tutorial')}</button>
      ${info ? `<button type="button" class="btn primary" id="btn-tut-next">${idx === STEPS.length - 1 ? t('ui.got_it') : t('ui.next')}</button>` : ''}</div></div>`;
  box.hidden = false;
  sound.say(step.voice, lang() === 'en');
  box.querySelector('#btn-tut-skip')?.addEventListener('click', () => {
    prefs.tutorial = -1;
    savePrefs();
    renderTutorial();
    lastTask = '';
    renderTaskbar();
  });
  box.querySelector('#btn-tut-next')?.addEventListener('click', () => {
    prefs.tutorial = idx + 1;
    savePrefs();
    renderTutorial();
  });
}

/** The Rawi pops out to explain something, outside the tutorial. */
function rawiSay(text: string, action?: { label: string; run: () => void }): void {
  if (prefs.tutorial >= 0) return; // the tutorial is speaking
  const box = $('rawi');
  box.classList.add('tip');
  box.innerHTML = `<div class="rawi-face">${rawiAvatar()}</div><div><p class="who">${t('ui.rawi_name')}</p><p class="d">${text}</p>
    <div class="row"><button type="button" class="btn" id="btn-rawi-ok">${action ? t('ui.later') : t('ui.got_it')}</button>
    ${action ? `<button type="button" class="btn primary" id="btn-rawi-do">${action.label}</button>` : ''}</div></div>`;
  box.hidden = false;
  box.querySelector('#btn-rawi-ok')?.addEventListener('click', () => (box.hidden = true));
  box.querySelector('#btn-rawi-do')?.addEventListener('click', () => {
    box.hidden = true;
    action?.run();
  });
}

let lastQuestionNudge = Date.now();
let treasuryNudged = false;
/** Gentle reminders: a history question now and then, and a warning when the treasury is nearly full. */
function nudges(): void {
  if (prefs.tutorial >= 0 || !sheet.hidden || !$('card').hidden || !$('rawi').hidden) return;
  const nearlyFull = treasuryNearlyFull(town, content);
  if (nearlyFull && !treasuryNudged) {
    treasuryNudged = true;
    return rawiSay(t('rawi.treasury'));
  }
  if (!nearlyFull) treasuryNudged = false;
  const chron = ageProgress(town, content, clock.now()).chronicle;
  const canAsk = chron.done < chron.of && nextQuestion(town, content) && questionsLeftToday(town, content, clock.now()) > 0;
  if (canAsk && Date.now() - lastQuestionNudge > 150_000) {
    lastQuestionNudge = Date.now();
    rawiSay(t('rawi.question'), { label: t('ui.answer'), run: () => openQuestion(questionsHost) });
  }
}

function clearGlow(): void {
  document.querySelectorAll('.tut-glow').forEach((el) => el.classList.remove('tut-glow'));
}

// --- Hover tooltip (desktop) ---------------------------------------------------------
function showTooltip(h: { uid: number; sx: number; sy: number } | null): void {
  const tip = $('tooltip');
  if (!h) {
    tip.hidden = true;
    return;
  }
  const b = findBuilding(town, h.uid);
  if (!b) return;
  const def = content.building(b.defId);
  const rate = outputPerHour(town, content, b);
  tip.innerHTML = `<b>${t(def.nameKey)}</b> · ${tr('ui.level_n', { n: b.level })}<br>${t(`desc.${def.id}`)}${def.produces ? `<br>${fmt(rate)} ${ICON[def.produces]} ${t('ui.per_hour')}` : ''}`;
  const rect = $('stage').getBoundingClientRect();
  tip.style.left = `${rect.left + h.sx}px`;
  tip.style.top = `${rect.top + h.sy}px`;
  tip.hidden = false;
}

// --- Taps on the map -------------------------------------------------------------------
function onCellTap({ x, y }: { x: number; y: number }): void {
  showTooltip(null);
  if (x < 0 || y < 0 || x >= town.width || y >= town.height) return;
  if (placing) {
    const defId = placing;
    const r = place(town, content, defId, x, y, clock.now());
    if (!r.ok) return toast(errorText(r.error));
    stopPlacing();
    const def = content.building(defId);
    const facts = buildingFacts(def, content).slice(0, 2).join(' · ');
    notice('🔨', tr('ui.built_title', { name: t(def.nameKey) }), facts);
    view.float(x, y, '✨');
    view.pop(r.building.uid);
    changed();
    return;
  }
  const gift = town.progress.gift;
  if (gift && gift.x === x && gift.y === y) {
    const r = collectGift(town, content, clock.now());
    if (r.ok) {
      const at = plotOnScreen(x, y);
      fly('coin', at.x, at.y, 8);
      view.float(x, y, `+${fmt(r.coin)} 🪙`);
      notice('🐚', t('ui.gift_title'), `+${fmt(r.coin)} ${ICON.coin}`);
      changed();
      return;
    }
  }
  const b = town.buildings.find((bb) => bb.x === x && bb.y === y);
  if (b && view.isReady(town, b)) {
    // One tap on a building with a ready bubble collects it.
    const r = collect(town, content, b.uid, clock.now());
    if (r.ok) {
      const at = plotOnScreen(x, y);
      fly(r.resource, at.x, at.y - 30, 4);
      view.float(x, y, `+${fmt(r.deposit ? r.deposit.added : r.amount)} ${ICON[r.resource]}`);
      view.pop(b.uid);
      save();
      refreshNow();
      return;
    }
  }
  if (b) return openBuilding(b.uid);
  closeSheet();
  if (!isOpen(town, x, y)) toast(errorText('tile_locked'));
}

// --- Refresh loop ---------------------------------------------------------------------
function refreshNow(): void {
  $('app').classList.toggle('sheet-open', !sheet.hidden);
  renderChips();
  renderTrackers();
  renderTaskbar();
  renderTutorial();
  if (sheetKind === 'routes') routesPanel.update();
  if (sheetKind === 'goals') agePanel.update();
}

/** Numbers in the open building sheet, without rebuilding its buttons (keeps taps reliable). */
function updateBuildingNumbers(): void {
  const b = openUid !== null ? findBuilding(town, openUid) : undefined;
  if (!b) return;
  const def = content.building(b.defId);
  if (!def.produces) return;
  const cap = storageCap(town, content, b);
  const rate = outputPerHour(town, content, b);
  const icon = ICON[def.produces];
  const st = sheet.querySelector<HTMLElement>('[data-stored]');
  if (st) st.textContent = `${fmt(b.stored)} / ${fmt(cap)} ${icon}`;
  const bar = sheet.querySelector<HTMLElement>('[data-stored-bar]');
  if (bar) bar.style.width = `${Math.min(100, (100 * b.stored) / Math.max(1, cap))}%`;
  const fi = sheet.querySelector<HTMLElement>('[data-full-in]');
  if (fi) fi.textContent = rate > 0 && b.stored < cap ? tr('ui.full_in', { time: wait(((cap - b.stored) / rate) * 3_600_000) }) : t('ui.is_full');
}

/** Where the day stands, 0 to 1 from dawn: a game day by the game clock (24 minutes in Showcase time). Looks only. */
function dayPhase(): number {
  const day = 24 * 3_600_000;
  return (((clock.now() - town.foundedAt) / day + 0.22) % 1 + 1) % 1;
}

/** Title screen: sets the tone, and its tap lets the browser start the music. */
function showTitle(): void {
  const el = $('title');
  // Automated tests skip it unless they ask for it with ?title.
  if (navigator.webdriver && !location.search.includes('title')) return el.remove();
  el.innerHTML = `<div class="sky"></div><div class="star"></div>
    <div class="logo"><h1>${t('app.title_short')}</h1><p class="sub">${t('ui.subtitle')}</p><p class="tag">${t('ui.tagline')}</p></div>
    <p class="begin">${t('ui.tap_to_begin')}</p>`;
  el.hidden = false;
  el.addEventListener('pointerdown', () => {
    el.classList.add('out');
    window.setTimeout(() => el.remove(), 900);
  }, { once: true });
}

const app = new Application();

async function start(): Promise<void> {
  const stage = $('stage');
  showTitle();
  installIconSwap($('app'));
  buildChrome();
  await app.init({ resizeTo: stage, background: 0xa8916a, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
  stage.appendChild(app.canvas);
  view = new TownView(app, content, onCellTap);
  view.onHover = showTooltip;
  try {
    const ids = Object.keys(BUILDING_ART);
    const textures = await Promise.all(ids.map((id) => Assets.load<Texture>(BUILDING_ART[id] as string)));
    view.setBuildingArt(Object.fromEntries(ids.map((id, i) => [id, textures[i] as Texture])));
  } catch (e) {
    console.warn('[art] building art failed to load; using placeholders', e);
  }
  view.layout(town);
  new ResizeObserver(() => app.resize()).observe(stage);
  $('scrim').addEventListener('click', closeCard);

  let uiTimer = 0;
  app.ticker.add((tk) => {
    const now = clock.now();
    tick(town, content, now);
    advanceRoutes(town, content, now);
    advanceGifts(town, content, now);
    view.sync(town, version);
    view.frame(town, placing, (x, y) => (placing ? canPlace(town, content, placing, x, y).ok : false), tk.deltaMS, dayPhase());
    uiTimer += tk.deltaMS;
    if (uiTimer > 250) {
      uiTimer = 0;
      refreshNow();
      if (sheetKind === 'building') updateBuildingNumbers();
    }
  });

  app.renderer.on('resize', () => view.layout(town));
  window.setInterval(save, 5000);
  const onVisit = () => {
    if (registerVisit(town, content, clock.now()).welcomeBack) notice('🌅', t('ui.welcome_back'), '');
  };
  onVisit();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
    else onVisit();
  });
  refreshNow();
  // Exposed for automated tests (tests/e2e). Not a gameplay API.
  (window as unknown as { __aoa: unknown }).__aoa = {
    get town() {
      return town;
    },
    content,
    clock: () => clock,
    cellPoint: (x: number, y: number) => view.screenPointOf(x, y),
    redraw: () => {
      version++;
      view.layout(town);
    },
  };
}

start().catch((e) => {
  console.error('[boot] failed to start', e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#fff;padding:12px">Failed to start: ${String(e)}</pre>`);
});
