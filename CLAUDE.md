# CLAUDE.md: Suhail: Ages of Arabia, vertical slice

Read this file first in every session. It is the operating manual for all agents.
Details live in `/docs`; this file links to them and holds only what every session needs.

## 1. What we are building

**Suhail: Ages of Arabia** is a mobile idle civilisation builder: one town grows through
seven ages of Arab history (about 500 BCE to 1971). Source of truth for design:
GDD v4.0 (27 Oct 2026, owner Filip Ivanovic). This repository builds the **vertical slice**,
"The Pearl Coast": a self-contained Age V chapter in which the player founds a pearling
town, plays one diving season, deals with one rival town, and ends with the age change
and a scripted preview of the pearl market collapse.

- Slice spec: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
- Decisions so far: [docs/DECISIONS.md](docs/DECISIONS.md)
- Plan and gates: [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md)
- Task board: [docs/TASKS.md](docs/TASKS.md)

**Product owner:** Filip. He approves every gate. He is not a programmer: explain
decisions in plain language, never claim something works without having run it.

## 2. Platforms and stack

| Item | Choice |
| --- | --- |
| Targets | Browser link (investor demo), Android and iOS apps via Capacitor (later phase) |
| Orientation | Portrait, one-handed, max layout width 480 px |
| Language | TypeScript (strict) |
| Rendering | PixiJS 8 (town scene) |
| Interface | HTML and CSS overlay; right-to-left ready |
| Build | Vite 6 |
| Tests | Vitest (core), Playwright (phone-size play-throughs) |
| Text | English first; Arabic interface strings (draft, need native review) |

Architecture detail: [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)

## 3. Project structure

```
src/core/      Game rules. No graphics, no DOM, no Date.now(). Runs in tests, tools and a future server.
src/client/    PixiJS scene, HTML interface, audio, browser storage. No game rules here.
content/       JSON data: buildings, balance, maps, text (en, ar). Every record has a status.
assets/        Art and audio. Each file has a row in docs/ASSET_INVENTORY.md.
tools/         Economy simulator, asset processing scripts.
tests/core/    Unit tests for src/core.
tests/e2e/     Playwright play-throughs and screenshots.
docs/          Specifications and reference material.
.claude/agents Role files for the specialist agents.
```

## 4. Commands

```
npm install          # once
npm run dev          # local server with hot reload
npm test             # core unit tests (must pass before any commit)
npm run typecheck    # TypeScript check
npm run build        # production build into dist/
npm run e2e          # phone-size play-through (run after npm run build)
npm run sim -- 21    # economy simulator; notes in docs/SIMULATION_NOTES.md
```

## 5. Rules that are never broken

1. **Rules live in `src/core`.** The client calls core functions; it never changes
   `TownState` directly. Anything random uses `Rng` with a seed. Anything timed uses
   `GameClock`. This is what lets a server take over later (GDD section 22).
2. **Numbers live in `content/`.** No balance value is hard-coded in TypeScript.
3. **Label every rule's origin.** In code comments and docs: `[GDD]` for original
   design, `[ASSUMPTION]` for our gap-filling, `[RECOMMENDATION]` for proposals awaiting
   sign-off. Never present an assumption as GDD design.
4. **Never fabricate history.** No invented facts, dates, quotes or sources. Every
   Archive page and question cites a source. Contested points are presented as contested.
   See [docs/HISTORICAL_RESEARCH.md](docs/HISTORICAL_RESEARCH.md).
5. **Real-people policy (GDD section 10).** Group C figures (the Prophet Muhammad and all
   prophets, the companions, early caliphs, Shi'a Imams, any living person, any member
   of a reigning family) never appear as characters. No invented dialogue for real people.
6. **Placeholders are visible.** Grey-box and temporary assets carry the magenta border
   or the placeholder notice and are listed in the asset inventory. Nothing temporary
   ships unlabelled.
7. **Verify before claiming.** "Done" means tests pass, the build runs and, for anything
   visible, a screenshot has been looked at.
8. **Never overwrite work.** Commit small, commit often. Do not delete assets or docs;
   move superseded files to an `archive/` folder.

## 6. Coding standards

- TypeScript strict mode, no `any`. Prefer plain functions over classes in `src/core`.
- Core actions return `Result` (`{ ok: true, ... } | { ok: false, error }`), never throw
  for player mistakes. Throw only for programmer or content errors (`ContentError`).
- Every core action calls `tick()` first so production up to now uses the old layout.
- New core behaviour needs a unit test. Bug fixes need a test that failed before the fix.
- Comments explain why, and cite the GDD section when implementing a GDD rule.
- Performance: no per-frame object creation in the client loop; rebuild Pixi objects only
  when `version` changes.

## 7. Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Files | kebab-case | `town-view.ts` |
| Types, classes | PascalCase | `TownState`, `GameClock` |
| Functions, variables | camelCase | `outputPerHour` |
| Content ids | snake_case | `date_grove`, `pearl_merchant` |
| Text keys | dotted | `building.date_grove`, `err.not_enough_coin` |
| Asset files | `<area>_<subject>_<variant>_v<NN>.<ext>` | `bld_date_grove_age5_v01.png` |

## 8. Assets, art and audio

- Art direction: [docs/ART_BIBLE.md](docs/ART_BIBLE.md) (painted-canvas aesthetic; written in Phase 3).
- Audio direction: [docs/AUDIO_DIRECTION.md](docs/AUDIO_DIRECTION.md).
- No volume asset generation before Gate 1 (Art Bible and style frames approved).
- Every asset row records: status, tool, prompt, licence, reviewer. Statuses:
  `required` → `prompt-prepared` → `generated` → `reviewed` → `integrated` → `approved`.
- Paid tool plans only (free tiers forbid commercial use). Key art gets human paint-over.
- This workspace cannot reach image or audio generation services unless Filip allows
  their domains. Default flow: agents write prompt sheets, Filip generates, agents review,
  process and integrate.

## 9. Agents

| Agent | File | Owns |
| --- | --- | --- |
| Director | main session (this file) | Scope, task board, gates, CLAUDE.md, talking to Filip |
| Designer | `.claude/agents/designer.md` | Slice specs, content data, economy simulator |
| Developer | `.claude/agents/developer.md` | Core rules, client, integration |
| Creative | `.claude/agents/creative.md` | Art Bible, interface kit, audio direction, prompts, asset review |
| Historian | `.claude/agents/historian.md` | Research, Archive, questions, all historical text |
| QA | `.claude/agents/qa.md` | Tests, play-throughs, screenshots, performance, acceptance |

Workflow, hand-offs and gates: [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md).
QA never reviews code it wrote. The Director does not mark a task done on an agent's word
alone: it checks the evidence (test output, screenshot).

## 10. Definition of Done

A task is done when: it meets its acceptance criteria in `docs/TASKS.md`; `npm test` and
`npm run typecheck` pass; `npm run build` succeeds; anything visible has been checked in
a phone-size screenshot; content records have the right status; docs are updated if a
decision or rule changed; the work is committed.

The slice is done when every item in docs/GAME_DESIGN.md section "Slice Definition of Done"
is met (mirrors the brief's section 12).

## 11. Current priorities (update when they change)

Phase 2 to 3 (week 1 to 2). Done: balance pass P2-09, Art Bible v0.1, image and ElevenLabs prompt
sheets, research pack, first five Archive drafts, story script v0.1. Next, in order:
1. Gate 1: Filip generates the style frames and audio from assets/prompts/; Creative reviews them.
2. Routes and decision points in core, grey-box (P4-01), using docs/story/STORY_SCRIPT.md.
3. Second balance pass (P2-10): slice sinks and a hoarding profile.
4. Remaining 10 Archive pages and 25 questions (P3-07).

Drafting arrangement: until funding, agents draft history, music direction and story; everything
stays `draft` and needs human review before any public playtest (decision of 1 Nov 2026).

## 12. Important constraints and decisions

- Engine: web stack for the slice; production engine decided at Gate 4 with device data.
- Slice framing: new pearling town in Age V ("The Pearl Coast").
- The GDD's "demand their return" choice for indebted divers is **removed** from the slice;
  the Archive treatment of pearl-diving labour waits for the human historical advisor.
- Portrait orientation; English first, Arabic-ready.
- No server, no real payments, no real ads, no accounts in the slice.
- The workspace is temporary. The git repository is the single record of the project.
