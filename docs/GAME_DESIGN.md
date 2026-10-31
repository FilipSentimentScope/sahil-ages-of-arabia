# Game design: The Pearl Coast vertical slice

Source of truth: GDD v4.0. This file specifies what the slice builds and labels every item:
**[GDD]** original design, **[ADJUSTED]** GDD design changed for the slice,
**[RECOMMENDATION]** our proposal (approved by Filip on 31 Oct 2026 where noted),
**[ASSUMPTION]** gap-filling pending confirmation, **[OPEN]** needs a decision.

## 1. The chapter in one paragraph

The player founds a small pearling town on the lower Gulf coast in Age V (about 1650 to 1929).
They build on a 6 by 6 grid, send caravans and ships, run one diving season, deal with one
rival town (the Island Harbour), and clear the three locks of the age. The chapter ends with
the age change to VI, shown through the town restyle, and a scripted preview of the pearl
market collapse. Target length of a first run in Showcase mode: about 25 minutes.

## 2. Framing [RECOMMENDATION, approved]

The Rawi opens with no more than three sentences: earlier ages have passed; this is a new town
on the pearl coast. A painted strip of the seven ages shows where the chapter sits.
First leader: Ahmad ibn Majid with the kamal and pilot's book [RECOMMENDATION].

## 3. Contents

| # | Item | Treatment | Label | Build status |
| --- | --- | --- | --- | --- |
| 1 | 6 by 6 town, twelve buildings, neighbour bonuses | Draft roster in `content/buildings.json` | [GDD], roster [ASSUMPTION] | Core done, grey-box done |
| 2 | Production, storage (4 h), production while away | Full speed until store is full | [GDD] | Core done |
| 3 | Water as the limit | Buildings reserve water; wells provide it per level | [GDD] | Core done |
| 4 | Upgrades, 14% cost growth, doubling at 10/25/50/100/200 | As written | [GDD] | Core done |
| 5 | Treasury limit, 30% overflow to savings chest, 1.5x safety rule | As written | [GDD] | Core done |
| 6 | Savings chest weekly free opening | Simulated in Showcase mode | [GDD], timing [ASSUMPTION] | Not started |
| 7 | Three locks: research, landmark, Chronicle | Mini trunk (3 nodes + 1 branch), Great Fort in 3 stages, 8-question chapter | [ADJUSTED] | Not started |
| 8 | Age change V to VI | Restyle animation, collapse preview, end card | [ADJUSTED] | Not started |
| 9 | Six leaders, abilities, resonance, tools in 3 qualities | Navigators (Ibn Majid, Maryam al-Ijliya), Merchants (Ibn Battuta, Ibn Khaldun), Guardians (Zenobia, Salah al-Din) | [GDD] leaders, grouping [RECOMMENDATION] | Not started |
| 10 | Doctrine choice | Offered in the first session, between the three doctrines above | [ADJUSTED] | Not started |
| 11 | Four routes, twelve decision points, coast or open sea | Odds per GDD section 12 | [GDD] | Not started |
| 12 | One rival: trade, raid on the player, raid by the player | Island Harbour | [GDD] | Not started |
| 13 | Diving season, one cycle, four beats | Fit out, dive, town alone, homecoming and sale | [GDD] | Not started |
| 14 | Fights | Painted tableau, one pre-fight choice, up to two ability taps, counter triangle | [GDD] rules, presentation [RECOMMENDATION] | Not started |
| 15 | Pinch point with two free ways past it | Mock shop, no payments | [GDD] | Not started |
| 16 | 25 history questions, 15 Archive pages | Sourced; each page also in a younger-reader version | [GDD] + [RECOMMENDATION] | Not started |
| 17 | Rawi script | New Age V script, max three sentences at a time | [GDD] rule | Not started |
| 18 | One town style, one leader outfit | Cosmetic demo | [GDD] | Not started |
| 19 | Classroom setting | Hides shop and Dana; learning objective per page; younger-reader text; end summary | [RECOMMENDATION] | Not started |
| 20 | Two time modes | Showcase (x60 draft) and Playtest (real timers) | [RECOMMENDATION] | Done |
| 21 | Analytics | Event logging in Playtest mode | [GDD] | Not started |
| 22 | English and Arabic | English first; Arabic interface strings; right-to-left layout | [RECOMMENDATION] | Interface done (draft Arabic) |

## 4. Removed or excluded

- **Removed:** the "demand their return" choice for indebted divers who fled (GDD Age V).
  The Archive treatment of pearl-diving labour, including enslaved African divers, waits for
  the human historical advisor. Crew debt itself stays as a mechanic; the forgive-debt option stays.
- **Excluded from the slice (stay in the GDD):** disputes, endowments, houses, league, season pass,
  partnerships, lineages, endings, real payments, real ads, accounts, game server.

## 5. Open items and assumptions

| # | Item | Status | Owner |
| --- | --- | --- | --- |
| A1 | The twelve-building Age V roster and all its numbers | [ASSUMPTION] draft | Designer, Historian, Filip |
| A2 | A neighbour matching several bonus tags contributes each bonus once | [ASSUMPTION] | Designer |
| A3 | Storehouse raises neighbours' storage by 50% | [ASSUMPTION] | Designer |
| A4 | Wells provide 6 water per level | [ASSUMPTION] | Designer |
| A5 | Showcase speed x60 (1 real second = 1 game minute) | [ASSUMPTION] | Designer, Filip |
| A6 | "Part of every coin you earn" goes to the savings chest (GDD section 20): the share is unspecified, so only overflow feeds the chest for now | [OPEN] | Designer |
| A7 | Food has no cap and no use yet in the slice; uses (caravan supplies, market sale) come with routes | [OPEN] | Designer |
| A8 | Population, garrison and water are kept in the background for comprehension (R3) | [RECOMMENDATION] | Designer |
| A9 | Fight unit counts and garrison composition | [OPEN] | Designer |
| A10 | Diving season: day count (KPI suggests 7), loss curve, pearl grades, prices | [OPEN] | Designer |

## 6. Success questions

From GDD section 24: first session holds past ten minutes; players choose questions freely;
the pinch point feels fair (Playtest mode only); the rival helps rather than confuses.
Added: after ten minutes players can explain coin, knowledge and reputation; the build holds
at least 30 frames per second on a 3 GB Android phone.

## 7. Slice Definition of Done (from the brief, section 12)

- [ ] The game launches (browser link and Android build)
- [ ] The player can complete the chapter
- [ ] Main mechanics work (items 1 to 15 above)
- [ ] Visual assets follow the Art Bible
- [ ] Animations and effects work
- [ ] Interface and navigation work
- [ ] Audio is integrated
- [ ] The Archive works
- [ ] Progression and saving work
- [ ] No critical bugs block play
- [ ] Builds for the agreed mobile target
- [ ] Documented and ready for further development
