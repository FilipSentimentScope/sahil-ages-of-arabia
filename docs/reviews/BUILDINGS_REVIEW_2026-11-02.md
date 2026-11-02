# Buildings review, batch 1 (2 Nov 2026)

Seven of twelve Age V buildings from Filip (storehouse, treasury, watchtower, majlis, scribe's house,
pearl merchant's house, jetty). Majlis and scribe's house arrived in one image with text labels; we
split them and dropped the labels. Backgrounds removed with `tools/cutout.py` (rembg, u2net).
Integrated as candidates; on-board check: `tests/e2e/screenshots/art-02-board-closeup.png`.

## Overall

- **Readable and consistent with each other**: one view angle, one light direction, plain backgrounds
  that cut out cleanly. At about 60 pt on a phone every building is recognisable.
- **Style does not match the reference.** They are drawn as clean illustrations with dark ink outlines
  and crisp cel-like shading. The Art Bible (section 3) and the approved town key art call for soft oil
  paint with no black outlines. On the painted board they read as stickers placed on a painting.
- **Decision needed from Filip** (below).

## Per building

| Building | Verdict | Notes |
| --- | --- | --- |
| Storehouse | OK as candidate | Walls of woven frond panels are right; roof is straw thatch again (frond mats wanted). |
| Treasury | Fix | Two gold "treasure chests" with spilled coins read as a pirate cliche; remove them. Blocks look like fired brick rather than coral stone. |
| Watchtower | Fix | Square European-castle battlements. Gulf towers of the period have plainer tops; use a historian-checked reference before regenerating. Raised door with ladder is right. |
| Majlis | Good | Frond roof on posts, cushions with sadu-like diamonds, coffee pots by the fire. |
| Scribe's house | Good | Small coral-stone house, shade awning, desk, papers. |
| Pearl merchant's house | Good | Courtyard house, carved door, red cloth and scales on the bench, wind tower (fits a wealthy house). |
| Jetty | Redo | Drawn on a cube of water with glass-like sides, which cannot sit on the shore row; mangrove poles drawn as trees with roots. |

## Options for the style

1. **Keep the illustrated style for buildings** and update the Art Bible: painted ground, outlined
   buildings for readability. Common in mobile builders; cheapest; weakens the "interactive painting" idea.
2. **Regenerate in the painterly style** (recommended to test first): add "no ink outlines, no line art,
   soft oil paint with visible brushstrokes exactly like the reference" to the prompts. Test on two
   buildings; if they stay readable at 60 pt, redo all twelve.

---

## Round 2 (2 Nov, afternoon): full sheet of twelve (bld_sheet_age5_v02.jpg)

Filip sent all twelve on one sheet, including the four fixes. Same illustrated style throughout, so
the set is consistent; taken as the style decision for buildings (DECISIONS, 2 Nov). Cut out with
tools/cutout.py and in the game on the new hex board. Screenshots: tests/e2e/screenshots/art-0*.png.

| Building | Verdict | Notes |
| --- | --- | --- |
| Well | Good | Minor, for the final version: the crank handle is a European winch detail; Gulf wells used a pulley on a wooden frame. |
| Date grove | Good | Palms with fruit, falaj wall. |
| Fish trap (hadra) | Good | Reed fence in shallow water; its own small pool sits well on a shore hex. |
| Palm-frond house | Good | Frond walls and gable roof. |
| Souq | Good | Awnings, sacks, spices, rope. |
| Jetty | Fixed | Background removal took away the water block; posts and boat remain. The boat is a plain rowboat: a small local boat would be better in the final version (Historian to name the type). |
| Pearl merchant's house | Good | Red cloth bundle and scales on the bench. |
| Majlis | Good | Open frond shelter, cushions, coffee pots by the fire. |
| Scribe's house | Good | |
| Watchtower | Fixed | Castle battlements gone; raised door with ladder kept. |
| Treasury | Fixed | Treasure chests gone. Stone still reads a little like brick; minor. |
| Storehouse | Fixed | Roof now reads as frond mats on poles. |

**Resolution.** Each building is about 250 px on the sheet. Sharp enough on most phones; slightly soft
on high-end screens. Before the investor demo: each building separately at 1024 px, same style.

**Hex board.** Buildings are drawn centred on their hex at 82% of its width, with a soft contact shadow.

---

## Round 3 (2 Nov, evening): five buildings at 1024 px (v03)

Souq, palm-frond house, fish trap, date grove and well, each on its own image at 1024 px. In the game,
replacing the v02 cut-outs (archived). Same illustrated style as the rest of the set.

| Building | Verdict | Notes |
| --- | --- | --- |
| Well | Good | Now a pulley on a wooden frame, as asked. |
| Palm-frond house | Good | |
| Souq | Good | Reads as a market hall; close in shape to the palm-frond house, but the stalls and goods tell them apart. |
| Date grove | OK | Sits on a square stone base with channels. On the hex board it reads as a tile on a tile; a version without the base would sit better. |
| Fish trap | OK | Again on a glass-sided block of water. On the shore hex the block shows; a version with only the reed fences and a little water around them would sit better. |
