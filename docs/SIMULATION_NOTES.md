# Economy simulator notes

Run with `npm run sim -- [days] [profile]`. Scope today: settlement only (no routes, diving,
rivals or research), greedy player, draft numbers. Results compare balance options; they are
not forecasts.

## Run 1, 31 Oct 2026 (draft roster, 7 days)

| Profile | Day 7 coin per hour | Coin lost to overflow, day 7 | Food stock, day 7 |
| --- | --- | --- | --- |
| Heavy (15 visits) | 1,786 | 5,722 | 176,097 |
| Engaged (7 visits) | 1,574 | 14,823 | 133,796 |
| Casual (3 visits) | 269 | 63 | 17,716 |

Findings, for the Designer's first balance pass:

1. **Food has no use yet**, so it piles up without limit. It needs sinks before tuning (caravan
   supplies, market sales with falling prices, population growth). Open item A7.
2. **The treasury limit bites hard from day 5** for heavy and engaged players: engaged players lose
   more coin to overflow than they keep. The GDD's own threshold (section 25: act if more than 15%
   of treasury income overflows) is far exceeded. Upgrade output grows faster than the limit.
3. **The casual gap is far too wide.** By day 7 a casual player's coin rate is about a sixth of an
   engaged player's; the GDD target (section 18) is that casual players take no more than about
   twice as long. Cause: four-hour storage with three visits a day wastes most production. The GDD's
   storage upgrades (to ten hours) and the welcome-back bonus are not in the core yet.

Next: add storage research and the welcome-back bonus, give food a sink, then retune
`content/balance.json` and `content/buildings.json` against the GDD section 18 targets.
