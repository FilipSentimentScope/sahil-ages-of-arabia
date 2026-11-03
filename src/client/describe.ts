/**
 * Plain-language descriptions for the interface: icons, building facts generated from content
 * (so they never drift from the rules), the odds of a route choice, and time formatting.
 */
import type { BuildingDef, LoadedContent, OutcomeDef, ResourceId } from '../core';
import { t } from './i18n';

/** Icons stand in for painted resource icons until the interface kit arrives (ART-003). */
export const ICON: Record<ResourceId | 'water', string> = {
  coin: '🪙',
  food: '🍞',
  knowledge: '📜',
  reputation: '⭐',
  water: '💧',
};

export const TRIP_ICON: Record<string, string> = { errand: '🐪', day: '🐫', long: '🐫', season: '⛵' };

/** Fill {name} style slots in a text. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function tr(key: string, vars: Record<string, string | number> = {}): string {
  return fill(t(key), vars);
}

/** Facts about a building, generated from its content record. */
export function buildingFacts(def: BuildingDef, c: LoadedContent): string[] {
  const out: string[] = [];
  if (def.produces) out.push(tr('fact.makes', { amount: def.outputPerLevelPerHour, icon: ICON[def.produces] }));
  if (def.waterProvided > 0) out.push(tr('fact.water_gives', { amount: def.waterProvided }));
  if (def.waterUse > 0) out.push(tr('fact.water_uses', { amount: def.waterUse }));
  for (const nb of def.neighbourBonuses) {
    const names = c.buildings.filter((b) => b.tags.includes(nb.fromTag)).map((b) => t(b.nameKey));
    if (names.length) out.push(tr('fact.bonus', { pct: nb.pct, names: names.join(' / ') }));
  }
  if (def.treasuryLimitPerLevel) out.push(tr('fact.treasury', { amount: def.treasuryLimitPerLevel }));
  if (def.neighbourStorageBonus) out.push(tr('fact.storage', { pct: Math.round(def.neighbourStorageBonus * 100) }));
  const terrain = (def.allowedTerrain.length ? def.allowedTerrain : ['open']).map((x) => t(`terrain.${x}`));
  out.push(tr('fact.stands_on', { terrain: terrain.join(', ') }));
  if (def.maxCount !== undefined) out.push(tr('fact.max', { n: def.maxCount }));
  return out;
}

/** What a building gives, as short items with icons, for build cards and the encyclopedia. */
export function provides(def: BuildingDef, c: LoadedContent): string[] {
  const out: string[] = [];
  if (def.produces) out.push(`+${def.outputPerLevelPerHour} ${ICON[def.produces]}/h`);
  if (def.waterProvided > 0) out.push(`+${def.waterProvided} ${ICON.water}`);
  for (const nb of def.neighbourBonuses) {
    const names = c.buildings.filter((b) => b.tags.includes(nb.fromTag)).map((b) => t(b.nameKey));
    if (names.length) out.push(tr('prov.bonus', { pct: nb.pct, name: names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0]! }));
  }
  if (def.treasuryLimitPerLevel) out.push(tr('prov.treasury', { n: def.treasuryLimitPerLevel }));
  if (def.neighbourStorageBonus) out.push(tr('prov.storage', { pct: Math.round(def.neighbourStorageBonus * 100) }));
  for (const r of c.routes.routes) if (r.requires === def.id) out.push(`🔓 ${t(r.nameKey)}`);
  if (def.tags.includes('home')) out.push(t('prov.home'));
  if (def.tags.includes('defence')) out.push(t('prov.defence'));
  if (def.waterUse > 0) out.push(`−${def.waterUse} ${ICON.water}`);
  return out;
}

/** "+20% cargo, 25% faster" for one outcome. */
export function effectText(o: OutcomeDef): string {
  const parts: string[] = [];
  if (o.cargoMult !== undefined && o.cargoMult !== 1) {
    const pct = Math.round(Math.abs(o.cargoMult - 1) * 100);
    parts.push(tr(o.cargoMult > 1 ? 'eff.cargo_up' : 'eff.cargo_down', { pct }));
  }
  if (o.timePct) parts.push(tr(o.timePct > 0 ? 'eff.time_up' : 'eff.time_down', { pct: Math.round(Math.abs(o.timePct) * 100) }));
  if (o.delayHours) parts.push(tr('eff.delay', { h: o.delayHours }));
  if (o.hullDamage) parts.push(t('eff.hull'));
  if (o.relation) parts.push(t(o.relation.delta > 0 ? 'eff.rel_up' : 'eff.rel_down'));
  return parts.length ? parts.join(', ') : t('eff.none');
}

/** Odds of an option in words: "7 in 8: +20% cargo · 1 in 8: −50% cargo". */
export function oddsText(outcomes: OutcomeDef[]): string[] {
  if (outcomes.length === 1) return [effectText(outcomes[0]!) === t('eff.none') ? t('ui.no_risk') : effectText(outcomes[0]!)];
  const total = outcomes.reduce((s, o) => s + o.weight, 0);
  return outcomes.map((o) => tr('ui.out_chance', { chance: chanceText(o.weight / total), effect: effectText(o) }));
}

function chanceText(p: number): string {
  // Small whole-number odds read better than percentages for most players.
  for (const d of [2, 3, 4, 5, 6, 7, 8, 10]) {
    const n = Math.round(p * d);
    if (n > 0 && Math.abs(n / d - p) < 0.01) return `${n} in ${d}`;
  }
  return `${Math.round(p * 100)}%`;
}

/** A game-time span as real time to wait ("2:40", "1 h 05"), given the clock's speed. */
export function waitText(gameMs: number, scale: number): string {
  const s = Math.max(0, Math.ceil(gameMs / scale / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
