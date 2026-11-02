# Technical architecture

## Decision

Web stack for the slice (approved 31 Oct 2026): TypeScript, PixiJS 8, HTML/CSS interface,
Vite, packaged for Android and iOS with Capacitor in a later phase. The production engine is
decided at Gate 4 using device performance data. Comparison and reasoning: Phase 1 plan,
section 4 (Claude Doc "Ages of Arabia: Phase 1 Analysis and Vertical Slice Plan").

## Layers

```
Platforms   Browser link | Android (Capacitor) | iOS (Capacitor)
Client      Town scene (PixiJS) | Screens (HTML/CSS) | Audio | Save, analytics adapters
Core        Clock and time modes | Settlement economy | Routes, sea, diving | Rivals, research, ages
Content     Buildings, leaders | Routes, decisions | Questions, Archive | Text en/ar, balance
```

- **Core** (`src/core`): pure TypeScript. No DOM, no `Date.now()`, no `Math.random()`.
  Time comes from `GameClock`, randomness from `Rng`. State is plain JSON (`TownState`), so it
  serialises for saves and can be sent to a server. The economy simulator and tests run the core
  directly. A future Node server can run the same code as the authority (GDD section 24:
  timing, currency, dives, storms, fights and drops decided on the server).
- **Client** (`src/client`): renders state and forwards player intent to core actions.
  It holds no rules. `version` bumps when the grid changes so Pixi objects rebuild only then.
- **Content** (`content/`): JSON validated at startup by `loadContent()`; bad content fails with
  a message naming the field. Every record carries `status`.

## Current modules

| Module | Purpose | Tests |
| --- | --- | --- |
| `core/types.ts` | Content and resource types | n/a |
| `core/clock.ts` | Game clock, time modes, offline catch-up | yes |
| `core/rng.ts` | Seeded random numbers | yes |
| `core/content.ts` | Content loading and validation | yes |
| `core/content-pack.ts` | Bundles the default JSON files | via others |
| `core/hex.ts` | Hex geometry: pointy-top, odd rows shifted right; neighbours, plot to pixel and tap to plot | yes |
| `core/settlement.ts` | Grid, placement, open and locked land, growth per age, water, production, storage, upgrades, treasury | yes |
| `core/save.ts` | Versioned save files, storage adapter | yes |
| `client/main.ts` | Boot, interface, input, autosave | e2e |
| `client/town-view.ts` | PixiJS hex board: ground rendered once to a texture, locked land greyed, town fence, buildings, storage bars, placement highlight, drag and pinch camera | e2e |
| `client/i18n.ts` | English and Arabic text, right-to-left switch | e2e |

## Planned modules

| Module | Phase |
| --- | --- |
| `core/routes.ts` (trips, decision points, coast or open sea) | 4 |
| `core/diving.ts` (four-beat season) | 4 |
| `core/rival.ts` (relations, rule-based actions every few hours) | 4 |
| `core/fight.ts` (counter triangle, abilities) | 4 |
| `core/court.ts` (leaders, fragments, resonance, tools) | 4 |
| `core/ages.ts` (research trunk, landmark stages, Chronicle, age change) | 4 |
| `core/chronicle.ts` (questions, Archive unlocks) | 4 |
| `tools/simulate.ts` (economy simulator: three player types, 21 days) | 2 to 4 |
| `client/audio.ts` | 5 |
| `client/analytics.ts` (event log, Playtest mode only) | 5 |

## Saves

`SaveFile { version, savedAtReal, clock, town }` as JSON in browser storage (key
`aoa.slice.save.v1`), written every 5 seconds and when the page is hidden. Unreadable saves
start a new town and log the reason. Version bumps need a migration function.

## Time modes

`balance.timeModes`: Showcase multiplies game time (draft x60), Playtest is fixed at 1 and
validated as such. Switching mode ticks production first, then rebases the clock.

## Performance budget (GDD section 24 targets)

| Target | Value | How we check |
| --- | --- | --- |
| Frame rate | 60 fps mid-range, never below 30 | Device test from Phase 4 on a 3 GB Android phone |
| First download | under 150 MB | Build size report |
| Tap to playing | under 4 s on mid-range | Device test |
| Battery | under 8% per 10-minute session | Device test, Phase 6 |

Headless Chromium on the build server uses software rendering, so its frame rate is not a
performance measure.

## Build and deploy

- `npm run build` produces `dist/`, deployable to any static host as a private link.
- Android: Capacitor project added in Phase 5; builds on Linux.
- iOS: needs a Mac with Xcode (to arrange before Phase 6).

## Testing strategy

1. Unit tests for every core rule (`tests/core`). Must pass before commit.
2. Economy simulator runs on every balance change; pacing targets in docs/GAME_DESIGN.md.
3. Phone-size Playwright play-throughs with screenshots (`tests/e2e`), run by QA.
4. Real-device checks on Filip's phones and one low-end Android, from Phase 4.
