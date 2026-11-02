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
