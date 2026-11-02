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
| ART-001 | Style frame: town key art (sf_town_keyart_v01.png; v02 approved) | approved | Google Gemini (image) | IMAGE_PROMPTS.md | Gemini paid plan; see licence note | Creative | v02 is the style reference for all art (Filip, 1 Nov) |
| ART-001b | Board painting (v02 approved; board_pearl-coast_v02.jpg) | retired 2 Nov (archived) | Google Gemini (image) | IMAGE_PROMPTS.md | Gemini paid plan; see licence note | Creative | Square grid cannot follow the hex map; kept in assets/art/processed/archive as a colour reference |
| ART-002 | Leader portrait, Ahmad ibn Majid (v03 approved) | approved | Google Gemini (image) | IMAGE_PROMPTS.md | Gemini paid plan; see licence note | Creative | v03 has a correct small kamal; artistic interpretation |
| ART-003 | Interface ornament kit (v03 approved) | approved | Google Gemini (image) | IMAGE_PROMPTS.md | Gemini paid plan; see licence note | Creative | v03: straight edges, ready to slice |
| BLD-01..05 | Well, date grove, fish trap, palm-frond house, souq at 1024 px (bld_*_age5_v03.jpg) | integrated (candidate) | Google Gemini (image) | Prompt doc, round 4 | Gemini paid plan; see licence note | Creative | In game 2 Nov evening, replacing their v02 cut-outs (archived). Date grove and fish trap sit on square bases; see review round 3 |
| REF-UI-01..05 | Filip's reference screenshots for game feel and interface (assets/art/incoming/reference) | reference only | n/a | n/a | third-party screenshots: never shipped | Creative | Direction for interface v2; not to be copied |
| BLD-06..12 | Remaining seven buildings, sheet v02 (bld_sheet_age5_v02.jpg; cut-outs bld_*_age5_v02.png) | integrated (candidate) | Google Gemini (image) | Prompt doc, rounds 3 and 4 | Gemini paid plan; see licence note | Creative | In game 2 Nov; jetty water block removed in processing; fish trap keeps its pool. About 250 px each on the sheet: final art needs 1024 px. See docs/reviews/BUILDINGS_REVIEW_2026-11-02.md round 2. v01 cut-outs archived |
| LDR-02..06, RAWI, TOOLS, TERRAIN, FIGHT, DIVE, ARC, AGES | Remaining art | prompt-prepared | Scenario (after Gate 1) | IMAGE_PROMPTS.md | | | Phase B |
| MUS-01 | Main theme sketch (temp; composer brief) | reviewed | Google Gemini (music) | ELEVENLABS_PROMPTS.md | Gemini paid plan; see licence note | Creative | Temp only; game copy in assets/audio/processed |
| MUS-02 | (in the game as a playlist since 2 Nov night: full track, MP3, with MUS-01; the 68 s loop is no longer used) Town bed ("Salt Air at Sunset"; loop cut 19.8 s to 87.6 s, 24 bars, 68 s) | reviewed | Google Gemini (music) | ELEVENLABS_PROMPTS.md | see licence note | Creative | 86 bpm (asked 84). Loop made with tools/make-loop.py; seam measured as an ordinary beat; Filip to confirm by ear (seam test file). Game copy: mus_town-bed_loop_v01.ogg, -16 LUFS |
| MUS-02b..d | Three more town tracks, 3 min each, soft start and end | prompt-prepared | Google Gemini (music) | ELEVENLABS_PROMPTS.md round 3 | | | Lengthen the town playlist to about 13 minutes |
| MUS-03 | Great dive loop (loop cut 18.9 s to 76.1 s, 57 s) | reviewed | Google Gemini (music) | ELEVENLABS_PROMPTS.md | see licence note | Creative | Loop cut 2 Nov (mus_great-dive_loop_v02.ogg); the full-length v01 game copy is archived |
| MUS-04 | Homecoming | reviewed | Google Gemini (music) | ELEVENLABS_PROMPTS.md | Gemini paid plan; see licence note | Creative | Accepted |
| MUS-05 | Collapse preview | reviewed | Google Gemini (music) | ELEVENLABS_PROMPTS.md | Gemini paid plan; see licence note | Creative | Check by ear: may be too full for the brief |
| AMB-01..03 | Ambient loops | prompt-prepared (deferred by Filip) | ElevenLabs Sound Effects | ELEVENLABS_PROMPTS.md | | | |
| SFX-01..30 | Sound effects | prompt-prepared (deferred by Filip) | ElevenLabs Sound Effects | ELEVENLABS_PROMPTS.md | | | |
| VO-01 | Rawi voice and 12 English lines (lines 01, 02, 03, 05, 06, 09, 11 play in the tutorial since 2 Nov) | integrated | Google Gemini (speech) | ELEVENLABS_PROMPTS.md | Gemini paid plan; see licence note | Creative | All 12 accepted; check lines 02, 04, 08 by ear; Arabic waits for a native writer |

## Licence note: Google Gemini (2 Nov 2026)

Filip generated the images, music and Rawi voice in Google Gemini on a paid plan (confirmed 2 Nov).
Google says it does not claim ownership of generated content, but we found no explicit permission to
sell or distribute it commercially, and Gemini music carries an invisible SynthID watermark. Fine for
the investor demo as temporary assets. Before any public release: confirm the terms in force for the paid plan, or move generation to a tool whose commercial terms are explicit, and replace the music
with the human composer's score as AUDIO_DIRECTION already plans. Not legal advice.

## Placeholders in use

| Where | What | Replace with |
| --- | --- | --- |
| Town view | Ground drawn from map data (soft colour per terrain, blurred, simple marks) | Painted terrain tiles (IMAGE_PROMPTS.md, terrain tiles) |
| Town view | Magenta-bordered hexes for any building without art (none on 2 Nov) | Building art |
| Interface | Emoji icons for resources and actions (🪙 💧 🍞 📜 ⭐ 🔨 🐪 🧺) | Painted icon set from the interface kit (ART-003) |
| Town view | Scenery drawn in code: oasis, palms, rocks, scrub, dune crests, dhows (drifting) on land outside the town and on the sea | Decor set DEC-01..08 (IMAGE_PROMPTS round 5) |
| Tutorial | Rawi face: dashed magenta circle reading "Rawi (art to come)" | Rawi portrait (RAWI prompt) |
| Interface | System font, plain panels | Interface kit (Phase 5) |
