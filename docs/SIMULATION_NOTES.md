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

## Run 3 (2 Nov 2026): hex board

Same balance as run 2. Changes: six neighbours per plot (cap of four helpful neighbours kept),
and the simulator now builds inside the 6 by 6 open block of the 12 by 12 map.

| Milestone | casual / engaged | engaged / heavy |
| --- | --- | --- |
| 100/h | 1.62 | 1.70 |
| 200/h | 1.78 | 1.14 |
| 400/h | 1.73 | 1.00 |
| 800/h | 1.63 | 1.10 |

Casual players stay inside the GDD target (2.0 or less); the first milestone improved from 2.17
to 1.62, because hexes give more plots that touch a well. Growth still compounds too fast
(value per hour about 25,000 by day 21): task P2-10 unchanged.

## Run 4 (2 Nov 2026): routes, the age's goals and a hoarder (P2-10)

**What changed in the simulator.** It now plays Age V to its end, using the real core rules:
routes (sent and answered as the GDD's player table says: heavy 12 routes and 6 questions a day,
engaged 6 and 3, casual 3 and 1), the three goals in `src/core/age.ts` (research trunk, Great Fort
in 3 stages, 8-question Chronicle), and a fourth player, the hoarder (engaged visits, never
upgrades). Overflow is measured up to the end of the age. `--seed=N` checks results against luck.

**What changed in the rules and numbers, and why.**

| Change | Why | Label |
| --- | --- | --- |
| Goal costs: research 1,950/5,850/14,300 knowledge and 5,100/15,300/37,400 coin; fort stages 51,000/102,000/153,000 | Sweep to the GDD's "about five days" for an engaged player | [ASSUMPTION] values |
| Fort stages and the next research node count in the treasury's safety rule | Without it, a fort stage cost more than the limit and heavy players could never finish | [GDD section 9] rule, now applied |
| Route cargo adds hours of the town's coin income: errand 0.5, day 3, long 7.5, season 14 | Fixed cargo made routes 3% to 10% of coin; the GDD calls routes the main source. Short trips pay more per hour, so heavy players send their 12 | [ASSUMPTION] |
| The treasury keeps room for cargo that is out, and for 2 (was 1.25) full collections | A returning ship overflowed even a player who spends; casual players lost 25% | [ASSUMPTION] |
| Bug: unloading removed the route before depositing, so its kept room vanished | Found by this run; test added that failed before the fix | Bug fix |
| Decisions stay open after the route is home, until it is unloaded | An engaged player (a visit every 2 h 40 min) never saw a decision on a 2-hour trip | [ASSUMPTION], replaces A18 |

**Result (16 days, five seeds).**

| Player | Age V done | Target | Overflow | Coin from routes |
| --- | --- | --- | --- | --- |
| Heavy | 3.6 to 3.7 days | about 1.5x faster than engaged: 1.44 to 1.48 | 0% to 1.4% | 61% to 66% |
| Engaged | 5.3 days | about 5 days | 0.6% to 4.2% | 39% to 43% |
| Casual | 8.0 days | at most 1.8x engaged: 1.50 | 3.5% to 19.7% | 57% to 67% |
| Hoarder | never (16 days) | should feel the limit | about 42% | 68% |

**Open points.**

1. Casual players finish on day 8 because the Chronicle needs 8 questions at one a day; their economy
   is ready by day 5. Fewer questions in the chapter, or more than one question a day for casual
   players, would close the gap. Designer and Filip to decide (A26).
2. Casual overflow crosses 15% on some seeds (worst 19.7%). The cause is big lumps of coin after
   8-hour gaps while saving for a fort stage.
3. Buildings still reach high levels (600 to 700 in total by day 16); the goals absorb the coin,
   not the upgrade curve. Fine inside one age; the age change (P4-06) must restyle and reprice.
4. Leaders, doctrines, rivals and the diving season are not in yet; each adds income or speed.

## Run 5 (11 Nov 2026): tasks, ranks and sea gifts (P2-11)

The simulator now claims tasks as they finish and picks up a sea gift at each visit if one is ashore.
No numbers were changed: the results stay inside the GDD targets (three seeds).

| Player | Age V done | Ratio | Overflow | Sea gifts over 16 days |
| --- | --- | --- | --- | --- |
| Heavy | 3.5 to 3.6 days | 1.39 to 1.42x faster than engaged (target about 1.5) | 0.5% to 2.4% | about 184,000 coin |
| Engaged | 5.0 days (target about 5; was 5.3) | | 3.1% to 5.8% | about 46,000 coin |
| Casual | 8.0 days | 1.61x engaged (target at most 1.8) | 10% to 12% | about 20,000 coin |
| Hoarder | never | | 47% to 49% | under 1,000 coin |

Every spending player reaches the top rank (pearl port, land 10 by 10) well inside the age. Sea gifts
favour players who visit often, as intended; they are the first number to trim if heavy players
pull too far ahead. Casual players still finish on day 8 because of the Chronicle (open point A26).
