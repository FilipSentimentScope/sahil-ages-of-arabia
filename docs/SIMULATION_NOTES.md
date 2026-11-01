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

## Run 2, 1 Nov 2026 (after balance pass P2-09, 14 days)

Changes: food market with falling price and market day [GDD section 9]; storage rising
0.5 hours per level from 4 to a 10-hour ceiling [GDD ceiling, per-level rate ASSUMPTION];
treasury limit at least 1.25x one full coin collection [ASSUMPTION]; welcome-back charges
tracked for routes [GDD section 18]. The simulator now measures time to equal progress,
which is what GDD section 18 targets, instead of output on a fixed day.

| Profile | Days to 100 value/h | to 200 | to 400 | to 800 | Overflow share | Food left |
| --- | --- | --- | --- | --- | --- | --- |
| Heavy | 1.0 | 1.6 | 2.0 | 2.3 | 0.0% | 0 |
| Engaged | 1.5 | 2.0 | 2.4 | 2.8 | 0.0% | 0 |
| Casual | 3.3 | 3.6 | 4.3 | 5.0 | 0.0% | 0 |

| Milestone | Casual / engaged (target 2.0 or less) | Engaged / heavy (target about 1.5) |
| --- | --- | --- |
| 100/h | 2.17 | 1.58 |
| 200/h | 1.85 | 1.21 |
| 400/h | 1.79 | 1.23 |
| 800/h | 1.74 | 1.22 |

Results against the three findings of run 1:

1. **Food:** no stockpile; it is sold every visit at a falling price. Fixed.
2. **Overflow:** 0% for a player who spends each visit (target under 15%). The limit now only
   bites when a player hoards, which is the GDD's intent. A hoarding profile should be added to
   confirm the limit still creates pressure. Fixed, to confirm.
3. **Casual gap:** 1.7 to 1.9 times engaged after day 1, inside the target. The first milestone
   (2.17) is slightly over, because a casual player has only three chances to spend on day 1.
   The GDD's day-1 design and the welcome-back bonus on routes should close it. Mostly fixed.

Tried and not adopted: storage rising 1 hour per level narrows the gap further (1.57 to 1.68)
but reaches the 10-hour ceiling at level 7, which removes the reason to visit more often.

Heavy players are only about 1.2x faster than engaged players (GDD: about 1.5x). Their
advantage in the GDD comes from routes and questions, which are not in the core yet.

**New issue for the next pass:** growth compounds too fast. Economy value per hour roughly
doubles every half day once a town is running, reaching about 16,000 by day 14. In the full game
age prices (about 3x per age), landmarks and research costs absorb this; the slice needs its
own sinks (landmark stages, research costs in coin, repairs) before absolute timings mean anything.

Bug found by the phone play-through and fixed: selling a tiny amount of food paid 0 coin and
the food vanished. Sales worth less than one coin are now refused.
