/**
 * Food market and visits.
 *
 * Market [GDD section 9, "Money lessons built into play"]: food prices change daily, peak on
 * market day each week, and selling a lot at once lowers the price, which recovers over the
 * following day. This is the first food sink; caravan supplies follow with routes.
 *
 * The unit price falls with the food sold recently: price(v) = base * day / (1 + v / saturation).
 * Selling `a` units starting from `v0` earns the integral of that curve, so revenue grows only
 * logarithmically with volume: a falling return, as the GDD requires of anything that earns coin.
 *
 * Welcome-back [GDD section 18]: after 12 hours or more away, the next three routes bring back
 * 50% more. Routes are not built yet; the charges are tracked here so they are ready.
 */
import { HOUR_MS } from './clock';
import type { LoadedContent } from './content';
import type { CoinDeposit, Result, TownState } from './settlement';
import { depositCoin, tick } from './settlement';

const DAY_MS = 24 * HOUR_MS;

/** Decay recent sales. [ASSUMPTION] Exponential, about 95% recovered after recoveryHours. */
function decayMarket(s: TownState, c: LoadedContent, now: number): void {
  const dt = Math.max(0, now - s.market.lastUpdate);
  if (dt > 0) {
    const tau = (c.balance.market.recoveryHours * HOUR_MS) / 3;
    s.market.foodSoldRecent *= Math.exp(-dt / tau);
    s.market.lastUpdate = now;
  }
}

export function isMarketDay(s: TownState, c: LoadedContent, now: number): boolean {
  const day = Math.floor(Math.max(0, now - s.foundedAt) / DAY_MS) % 7;
  return day === c.balance.market.marketDayIndex;
}

function dayMultiplier(s: TownState, c: LoadedContent, now: number): number {
  return isMarketDay(s, c, now) ? c.balance.market.marketDayMultiplier : 1;
}

/** Current price of one more unit of food, in coin. */
export function foodPrice(s: TownState, c: LoadedContent, now: number): number {
  decayMarket(s, c, now);
  const m = c.balance.market;
  return (m.foodBasePrice * dayMultiplier(s, c, now)) / (1 + s.market.foodSoldRecent / m.foodSaturation);
}

/** Coin that selling `amount` food would earn right now, without selling. */
export function quoteFoodSale(s: TownState, c: LoadedContent, amount: number, now: number): number {
  decayMarket(s, c, now);
  const m = c.balance.market;
  const k = m.foodSaturation;
  const v0 = s.market.foodSoldRecent;
  return m.foodBasePrice * dayMultiplier(s, c, now) * k * Math.log((k + v0 + amount) / (k + v0));
}

export function sellFood(
  s: TownState,
  c: LoadedContent,
  amount: number,
  now: number,
): Result<{ sold: number; coin: number; deposit: CoinDeposit }> {
  tick(s, c, now);
  const sold = Math.floor(Math.min(amount, s.resources.food));
  if (sold < 1) return { ok: false, error: 'nothing_to_collect' };
  const coin = Math.floor(quoteFoodSale(s, c, sold, now));
  // Never take food for nothing: a sale worth less than one coin is refused, food stays.
  if (coin < 1) return { ok: false, error: 'too_little_to_sell' };
  s.resources.food -= sold;
  s.market.foodSoldRecent += sold;
  s.progress.stats.foodSold += sold;
  const deposit = depositCoin(s, c, coin);
  return { ok: true, sold, coin, deposit };
}

/** Call at the start of every visit. Grants welcome-back charges after a long absence. */
export function registerVisit(s: TownState, c: LoadedContent, now: number): { welcomeBack: boolean } {
  const wb = c.balance.welcomeBack;
  const away = now - s.lastVisit;
  s.lastVisit = Math.max(s.lastVisit, now);
  if (away >= wb.awayHours * HOUR_MS) {
    s.welcomeBackCharges = wb.routeCharges;
    return { welcomeBack: true };
  }
  return { welcomeBack: false };
}
