# Task board

Status: `todo`, `doing`, `review` (with QA), `done`, `blocked`. Owner is an agent role.
Each task lists acceptance criteria. The Director keeps this file current.

## Phase 2 (week 1)

| ID | Task | Owner | Status | Acceptance criteria |
| --- | --- | --- | --- | --- |
| P2-01 | Project skeleton and toolchain | Developer | done | Builds, tests run, git initialised |
| P2-02 | Core settlement rules | Developer | done | GDD section 6 and 9 rules implemented with tests; GDD example (60/75 food) passes |
| P2-03 | Grey-box town screen | Developer | done | Phone-size play-through places, collects, upgrades, saves, switches to Arabic with no console errors |
| P2-04 | CLAUDE.md and docs | Director | done | All files listed in CLAUDE.md exist and link correctly |
| P2-05 | Agent role files | Director | done | Five files in .claude/agents with scope, inputs, outputs, rules |
| P2-06 | Economy simulator skeleton | Designer, Developer | done | `npm run sim` plays heavy, engaged and casual profiles for N days with the current roster and prints coin, food, knowledge, reputation and treasury overflow per day. First findings in docs/SIMULATION_NOTES.md |
| P2-09 | First balance pass: food sink, storage upgrades, welcome-back bonus, retune against GDD section 18 | Designer, Developer | done | Simulator shows casual within about 2x of engaged; overflow under 15% of treasury income for engaged players. Result: 1.74 to 1.85 after day 1 (2.17 at the first milestone); overflow 0%; food sold. See SIMULATION_NOTES run 2 |
| P2-10 | Second balance pass: slice sinks (landmark stages, research coin costs, repairs) and a hoarding profile in the simulator | Designer, Developer | todo | Growth no faster than the GDD's Age V length (about 5 days engaged) allows; hoarding profile shows treasury pressure |
| P2-07 | Asset requirement list review | Creative | todo | ASSET_INVENTORY rows checked against GAME_DESIGN contents; counts confirmed |
| P2-08 | Connect GitHub repository | Filip, Director | blocked | Repository exists and is reachable; history pushed |

## Phase 3 (weeks 2 to 3)

| ID | Task | Owner | Status | Acceptance criteria |
| --- | --- | --- | --- | --- |
| P3-01 | Art Bible draft | Creative | todo | All sections in ART_BIBLE.md filled; reference pack with sources; banned-elements list |
| P3-02 | Style-frame prompt sheets (town, leader portrait, interface screen) | Creative | todo | Prompts for Midjourney and Scenario, with negative prompts and reference notes |
| P3-03 | Historian review of style references | Historian | todo | Each reference checked for period and place; flags logged |
| P3-04 | Audio direction draft and theme brief for the composer | Creative | todo | AUDIO_DIRECTION.md filled; theme brief one page |
| P3-05 | Research pack outline and first five Archive drafts | Historian | todo | Each draft 120 to 250 words, sourced, younger-reader version, status draft |
| P3-06 | Age V Rawi script, first session | Historian, Designer | todo | Max three sentences per line; no invented quotes |

## Phase 4 (weeks 2 to 5)

| ID | Task | Owner | Status | Acceptance criteria |
| --- | --- | --- | --- | --- |
| P4-01 | Routes and decision points (core) | Developer | todo | Four trip lengths, decision points from content, coast or open sea odds per GDD section 12, seeded outcomes, tests |
| P4-02 | Diving season (core) | Developer, Designer | todo | Four beats, dive-one-more-day choice, sale choice, tests |
| P4-03 | Rival town (core) | Developer | todo | Relations scale, trade, raids both ways, daily relation cap, tests |
| P4-04 | Fights (core) | Developer | todo | Counter triangle, enemy mix shown before commit, two ability taps, tests |
| P4-05 | Court: leaders, fragments, doctrine, resonance, tools | Developer, Designer | todo | Six leaders from content, resonance +50% passive, tools in three qualities, tests |
| P4-06 | Ages: research trunk, landmark stages, Chronicle chapter, age change | Developer | todo | Three locks gate the change; age change restyles buildings, tests |
| P4-07 | Grey-box screens for all of the above | Developer | todo | Phone-size play-through of the whole chapter |
| P4-08 | First device test of the grey box | QA, Filip | todo | Frame rate on a 3 GB Android phone recorded |
