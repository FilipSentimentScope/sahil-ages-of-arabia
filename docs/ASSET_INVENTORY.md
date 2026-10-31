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

| ID | Asset | Status | Tool | Prompt file | Licence | Reviewer | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ART-001 | Style frame: town | required | Midjourney | | | | Gate 1 |
| ART-002 | Style frame: leader portrait (Ahmad ibn Majid) | required | Midjourney | | | | Gate 1; Historian checks dress and objects |
| ART-003 | Style frame: interface screen | required | Midjourney | | | | Gate 1 |
| AUD-001 | Theme sketch | required | Composer (Suno sketch allowed as reference only) | | | | Gate 1 |

## Placeholders in use

| Where | What | Replace with |
| --- | --- | --- |
| Town view | Coloured rounded squares with magenta border for all 12 buildings | Painted building art (Phase 5) |
| Town view | Flat colour terrain tiles | Painted terrain (Phase 5) |
| Interface | System font, plain panels | Interface kit (Phase 5) |
