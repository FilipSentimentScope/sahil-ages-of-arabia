# Asset inventory

Every asset in the slice has one row. Status flow:
`required` → `prompt-prepared` → `generated` → `reviewed` → `integrated` → `approved`.
Placeholders in the build are listed under "Placeholders in use" until replaced.

Columns: ID, asset, spec, status, tool, prompt file, licence, reviewer, notes.
Filename convention: `<area>_<subject>_<variant>_v<NN>.<ext>` (see CLAUDE.md).

## Requirements by area (draft counts, Creative to confirm in P2-07)

| Area | Count | Spec (draft) |
| --- | --- | --- |
| Town background and terrain tiles | 1 background, 7 terrain types | Portrait, painted; tiles readable at 56 px |
| Buildings, Age V style | 12 | One per roster entry, readable at 56 px, transparent background |
| Buildings, Age VI restyle (preview) | 12 | Same footprint, restyled for the age-change preview |
| Landmark: the Great Fort | 3 stages | Built in stages |
| Leader portraits | 6 | Bust, painted; consistent lighting and frame |
| Leader outfit (cosmetic demo) | 1 | Alternate outfit for one leader |
| Rawi portrait | 1 plus 2 expressions | Invented storyteller, not a historical person |
| Tools | 3 kinds x 3 qualities = 9 icons | Kamal and pilot's book, diving kit, khanjar |
| Rival town (Island Harbour) | 1 vignette | For the region view |
| Region map | 1 | Player town, rival, routes |
| Fight tableaux | 3 | Defence, raid, plus the counter overlay |
| Diving season scenes | 4 | Fit out, the dive, the town alone, homecoming |
| Archive illustrations | 15 | One per page; sourced references logged |
| Seven-ages strip | 1 | Opening framing |
| Interface kit | 1 set | Frames, buttons, panels, icons for coin, food, knowledge, reputation, water, Dana |
| Town style (cosmetic demo) | 1 set | Alternate palette or decoration set |
| Main music theme | 1 | Human composer |
| Ambient loops | 3 | Town, sea, souq |
| Sound effects | about 30 | Interface, collect, build, upgrade, sea, storm, fight, reward |
| Rawi narration lines | first-session lines | Draft voice, final by native speaker or actor |

## Rows

Prompts: assets/prompts/IMAGE_PROMPTS.md and assets/prompts/ELEVENLABS_PROMPTS.md.

| ID | Asset | Status | Tool | Prompt file | Licence | Reviewer | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART-001 | Style frame: town key art (sf_town_keyart_v01.png; v02 approved) | approved | tool to confirm | IMAGE_PROMPTS.md | to log | Creative | v02 is the style reference for all art (Filip, 1 Nov) |
| ART-001b | Board painting (v02 approved; board_pearl-coast_v02.jpg) | retired 2 Nov (archived) | tool to confirm | IMAGE_PROMPTS.md | to log | Creative | Square grid cannot follow the hex map; kept in assets/art/processed/archive as a colour reference |
| ART-002 | Leader portrait, Ahmad ibn Majid (v03 approved) | approved | tool to confirm | IMAGE_PROMPTS.md | to log | Creative | v03 has a correct small kamal; artistic interpretation |
| ART-003 | Interface ornament kit (v03 approved) | approved | tool to confirm | IMAGE_PROMPTS.md | to log | Creative | v03: straight edges, ready to slice |
| BLD-01..12 | All twelve buildings, sheet v02 (bld_sheet_age5_v02.jpg; cut-outs bld_*_age5_v02.png) | integrated (candidate) | tool to confirm | Prompt doc, rounds 3 and 4 | to log | Creative | In game 2 Nov; jetty water block removed in processing; fish trap keeps its pool. About 250 px each on the sheet: final art needs 1024 px. See docs/reviews/BUILDINGS_REVIEW_2026-11-02.md round 2. v01 cut-outs archived |
| LDR-02..06, RAWI, TOOLS, TERRAIN, FIGHT, DIVE, ARC, AGES | Remaining art | prompt-prepared | Scenario (after Gate 1) | IMAGE_PROMPTS.md | | | Phase B |
| MUS-01 | Main theme sketch (temp; composer brief) | reviewed | Eleven Music | ELEVENLABS_PROMPTS.md | to log | Creative | Temp only; game copy in assets/audio/processed |
| MUS-02 | Town bed | prompt-prepared | Eleven Music | ELEVENLABS_PROMPTS.md | | | Filip sends 2 Nov |
| MUS-03 | Great dive loop | reviewed | Eleven Music | ELEVENLABS_PROMPTS.md | to log | Creative | Loop section to be cut (track fades out) |
| MUS-04 | Homecoming | reviewed | Eleven Music | ELEVENLABS_PROMPTS.md | to log | Creative | Accepted |
| MUS-05 | Collapse preview | reviewed | Eleven Music | ELEVENLABS_PROMPTS.md | to log | Creative | Check by ear: may be too full for the brief |
| AMB-01..03 | Ambient loops | prompt-prepared (deferred by Filip) | ElevenLabs Sound Effects | ELEVENLABS_PROMPTS.md | | | |
| SFX-01..30 | Sound effects | prompt-prepared (deferred by Filip) | ElevenLabs Sound Effects | ELEVENLABS_PROMPTS.md | | | |
| VO-01 | Rawi voice and 12 English lines | reviewed | ElevenLabs Voice Design + TTS | ELEVENLABS_PROMPTS.md | to log | Creative | All 12 accepted; check lines 02, 04, 08 by ear; Arabic waits for a native writer |

## Placeholders in use

| Where | What | Replace with |
| --- | --- | --- |
| Town view | Ground drawn from map data (soft colour per terrain, blurred, simple marks) | Painted terrain tiles (IMAGE_PROMPTS.md, terrain tiles) |
| Town view | Magenta-bordered hexes for any building without art (none on 2 Nov) | Building art |
| Interface | System font, plain panels | Interface kit (Phase 5) |
