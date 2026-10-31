# Development roadmap

About 12 weeks from approval (approved 31 Oct 2026, so week 1 starts 2 Nov 2026 and the
target is early February 2027). Dates hold if reviews return within two working days and a
human historian is available by week 8.

| Phase | Weeks | Output | Gate at end |
| --- | --- | --- | --- |
| 1 Discovery | done | Phase 1 analysis and slice plan | G0 (passed) |
| 2 Planning and architecture | 1 | CLAUDE.md, docs, agent roles, project skeleton, core settlement rules, grey-box town | none |
| 3 Creative foundation | 2 to 3 | Art Bible, interface kit, audio direction, three style frames, theme sketch | G1 |
| 4 Core gameplay, grey box | 2 to 5 | Routes, diving, rival, fights, court, ages, Chronicle in grey box; economy simulator; first device test | G2 |
| 5 Integration and polish | 6 to 10 | Final art and audio in, Archive, Classroom setting, analytics, Android build | G3 |
| 6 QA and validation | 11 to 12 | Device tests, fixes, known-issues list, playtest build | G4 |

## Phase 2 status (week 1)

Done:
- Project skeleton (Vite, TypeScript, PixiJS, Vitest), git repository
- Core: clock with time modes, seeded random numbers, content validation, settlement rules
  (placement, water, neighbours, production, storage, upgrades, treasury, savings-chest overflow),
  versioned saves. 21 unit tests passing.
- Grey-box town screen: portrait, English and Arabic with right-to-left, place, collect, upgrade,
  autosave, production while away. Phone-size Playwright play-through passing.
- CLAUDE.md, docs, agent role files

Remaining in Phase 2:
- Economy simulator skeleton
- Asset requirement list reviewed by Creative
- Private GitHub repository connected (needs Filip)

## Human bottlenecks

| Input | Needed by | Blocks |
| --- | --- | --- |
| GitHub repository | Week 1 | Safe storage beyond this workspace |
| Image tool subscription (Midjourney, Scenario) | Week 2 | Style frames, Gate 1 |
| Audio tool subscription (ElevenLabs) | Week 3 | Audio direction samples |
| Human historian | Week 8 | Gate 3 |
| Native Arabic writer | Week 6 | Arabic text in the build |
| Composer | Week 6 | Main theme |
| Mac with Xcode | Week 10 | iOS build |
