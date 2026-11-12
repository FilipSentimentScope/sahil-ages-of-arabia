# Image prompt sheet (v0.1)

Follows docs/ART_BIBLE.md. Two phases:
- **Phase A (now, for Gate 1):** three style frames in Midjourney. Pick the best, tell us which.
- **Phase B (after Gate 1):** train a Scenario style model on the approved frames, then generate
  every production asset from that model with the subject prompts below.

How to report results: save each chosen image as `<ID>_v01.png` and upload it to the chat, or
commit it to `assets/art/incoming/`. We review, log it in docs/ASSET_INVENTORY.md and process it.

## Shared blocks (paste into every prompt)

**Style block**
> painterly historical illustration, oil and gouache on textured canvas, visible confident brushstrokes, soft atmospheric late-afternoon light, restrained warm palette of sand ochre, coral white, palm green, shallow turquoise and deep indigo, hand-painted, museum-quality, lower Arabian Gulf coast, 18th to early 20th century

**Negative block** (Midjourney `--no`; Scenario "negative prompt")
> cartoon, anime, chibi, 3d render, CGI, plastic, glossy, neon, lens flare, text, letters, Arabic script, watermark, logo, signature, frame, genie, magic lamp, flying carpet, onion dome, Taj Mahal, palace, belly dancer, fantasy armour, European ship, modern building, concrete, electric light

**Midjourney parameters**
- Key art and scenes: `--ar 9:16 --style raw --s 150`
- Single assets (buildings, icons): `--ar 1:1 --style raw --s 100`
- Keep consistency across a set: after you pick the first winner, add `--sref <URL of winner>`.
- Same character across images: add `--oref <URL>` (V7 omni reference; on older versions `--cref <URL>`).
- Use a paid plan. If the company paying earns over $1M a year, Midjourney requires Pro or Mega.
  Either way Pro is recommended: its Stealth mode keeps unreleased art private.

---

## Phase A: style frames for Gate 1

### ART-001 Town key art (portrait)
```
A small new pearling settlement on a shallow Gulf shore at late afternoon, seen from a gentle height: a cluster of palm-frond arish houses, one coral-stone courtyard house with a single square wind tower, date palms around a stone-lined well, three wooden Gulf pearling boats with furled lateen sails drawn up on the wet sand, rope nets drying on poles, calm turquoise shallows fading to deep blue, a low headland on the right where a fort will one day stand, gulls, long soft shadows, [STYLE BLOCK] --ar 9:16 --style raw --s 150 --no [NEGATIVE BLOCK]
```
Variants to try: morning light; slightly higher camera.

### ART-001b Town at gameplay angle
```
Top-down three-quarter view of a small square plot of sandy coastal land divided into a soft 6 by 6 grid of building plots, a creek of water crossing two plots, a strip of shoreline along the bottom edge, dunes in two corners, a salt flat patch, no buildings yet except one stone well, painted like a map in a museum, gentle shadows, [STYLE BLOCK] --ar 9:16 --style raw --s 100 --no [NEGATIVE BLOCK], people, boats
```
Purpose: checks whether the painted look still reads as a playable board.

### ART-002 Leader portrait: Ahmad ibn Majid (artistic interpretation)
```
Half-length portrait of a weathered Arab master navigator of the 15th century from Julfar, about fifty, short greying beard, calm intelligent eyes, sun-darkened skin, plain cream long shirt and a simple wrapped head cloth, a woollen cloak over one shoulder, holding up a small wooden kamal board on a knotted cord toward the night sky, a rolled pilot's book tucked under his arm, deep indigo background with a few faint stars, warm lantern light on his face from below left, dignified, [STYLE BLOCK] --ar 4:5 --style raw --s 150 --no [NEGATIVE BLOCK], turban jewel, gold, sword, crown
```
Note: no authentic portrait of Ibn Majid exists; this is an interpretation and the Archive says so.

### ART-003 Interface ornament kit
```
Game interface ornament sheet on a neutral background: an empty rectangular panel of aged cream paper with thin brass-coloured border lines, corner ornaments built from geometric patterns of traditional sadu weaving and carved gypsum screens, a matching thin divider, a round medallion frame, two button shapes (wide and square), all flat, frontal, evenly lit, clean edges, no text, [STYLE BLOCK] --ar 1:1 --style raw --s 80 --no [NEGATIVE BLOCK], calligraphy, mosque, perspective
```
We assemble the actual screen from these pieces in code; generated text in images is never used.

**Gate 1 checklist (you decide):** does it feel like a painting rather than a mobile game? Does it
read as the Gulf coast and not a generic desert? Would you put it in front of an investor?

---

## Phase B: production assets (after Gate 1)

Workflow: in Scenario (Pro plan), train a **Style** model on 15 to 30 approved images (the chosen
frames plus their best variants). Generate each asset below with that model, the negative block, and
the stated size. Buildings and icons: plain light background so we can cut them out.

### Buildings (12, Age V), 1024 x 1024, three-quarter top-down, single building, centred
Template: `single [SUBJECT], three-quarter top-down view, centred on a plain light sand background, soft shadow beneath, game building asset, [STYLE BLOCK]`

| ID | Subject |
| --- | --- |
| BLD-01 well | stone-lined well with a wooden pulley frame, rope and a leather bucket, wet stones around it |
| BLD-02 date_grove | small grove of six date palms with clustered dates, low mud-and-stone garden wall, a narrow water channel |
| BLD-03 fish_trap | hadra fish trap of palm-rib fences set in shallow turquoise water in an arrow shape |
| BLD-04 barasti_house | palm-frond arish house on a pole frame, woven frond panels, small shaded entrance |
| BLD-05 souq | small covered market stall row with palm-frond awnings, sacks of grain, dates, rope and pottery |
| BLD-06 jetty | short wooden jetty on mangrove poles over shallow water, a small boat tied to it |
| BLD-07 pearl_merchant | coral-stone house of a pearl merchant with a carved wooden door, a bench outside, a small red cloth bundle and brass scales on the bench |
| BLD-08 majlis | open-sided majlis building with low cushions along the walls, palm-frond roof, coffee pots by a small fire |
| BLD-09 scribe_house | small coral-stone house with a shaded bench, a low writing desk, reed pens and paper rolls |
| BLD-10 watchtower | round coral-stone watchtower with a narrow doorway high up and a wooden ladder |
| BLD-11 treasury | squat coral-stone strongroom with a heavy studded wooden door and small high windows |
| BLD-12 storehouse | palm-frond and pole storehouse stacked with sacks, jars and rolled mats |

Age VI restyle preview (same 12, for the age change): append `in the 1930s, slightly weathered, a few corrugated-iron patches, quieter, fewer goods` and reuse the Age V image as an image reference so the footprint matches.

Landmark, the Great Fort in 3 stages (1024 x 1024): `coral-stone coastal fort on a low headland, square towers, [stage 1: foundations and scaffolding of palm poles | stage 2: walls half built, one tower | stage 3: complete fort with a flagless round tower], three-quarter top-down view, [STYLE BLOCK]`

### Terrain tiles (8), 1024 x 1024, seamless top-down texture (next after the buildings)
The game fills each hex with one of these and blends the edges, so no tile may contain objects,
shadows from objects, a horizon or hex lines. Must tile seamlessly (check with an offset of half the image).
`seamless tileable top-down painted texture of [open sand with faint footprints | wet shoreline sand with a thin foam edge | shallow turquoise creek water over sand | rippled golden dune sand | white crusted salt flat (sabkha) | rocky wadi bed | rough mountain rock | deep blue-green open sea with soft light ripples], flat even lighting, no objects, no horizon, soft oil paint, [STYLE BLOCK]`

### Leaders (5 more), 1024 x 1280, same framing as ART-002, use `--oref`/reference for the style
| ID | Subject (artistic interpretation; Historian checks dress) |
| --- | --- |
| LDR-02 Maryam al-Ijliya | 10th-century woman astrolabe maker of Aleppo, modest period dress and head covering, holding a brass astrolabe, workshop tools behind her |
| LDR-03 Ibn Battuta | 14th-century traveller from Tangier, travel-worn robe and head cloth, a satchel and a folded letter, road dust |
| LDR-04 Ibn Khaldun | 14th-century scholar born in Tunis, sober scholar's robes, a book open on a stand, thoughtful |
| LDR-05 Zenobia of Palmyra | 3rd-century queen of Palmyra in Palmyrene dress and jewellery of the period, a desert caravan city behind her, regal |
| LDR-06 Salah al-Din | 12th-century commander, mail shirt under a plain surcoat, simple helmet held at his side, composed |
| LDR-OUT-01 outfit | the chosen leader in a second, festive outfit for the cosmetic demo |

### The Rawi, 1024 x 1280 (+ 2 expressions)
`elderly Gulf Arab storyteller in his seventies, invented character, white beard, kind deep-set eyes, plain long robe and wrapped head cloth, seated on a mat, one hand raised mid-story, warm lantern light, [STYLE BLOCK]`; expressions: smiling; serious.

### Tools (3 kinds x 3 qualities), 1024 x 1024 icon, plain dark background
| Kind | Plain | Fine | Master |
| --- | --- | --- | --- |
| Kamal and pilot's book | rough wooden kamal on hemp cord, worn notebook | polished wood kamal, bound book with leather cover | kamal with brass edging, book with tooled leather and a brass clasp |
| Diving kit | horn nose clip, rope basket, rough stone weight | turtle-shell nose clip, tight net basket, smooth haematite weight | carved turtle-shell clip on a braided cord, fine net basket, polished weight with a brass ring |
| Khanjar | plain curved dagger in a leather sheath | sheath with brass wire bands | sheath with silver filigree, horn hilt |

### Rival and region
- RIV-01 Island Harbour vignette (1024 x 1024): `a small island harbour town across the water, low coral-stone houses, a watchtower, boats at anchor, seen from the sea at dusk, [STYLE BLOCK]`
- MAP-01 Region map (1024 x 1536): `painted map of an invented stretch of the lower Gulf coast, the player's bay, an island harbour offshore, an inland oasis, shallow reefs, sea routes as faint dotted lines, no text, [STYLE BLOCK]`

### Fight tableaux (3), 1536 x 1024
`painted battle tableau on a beach, [defenders with round shields holding a line against riders | archers on dunes facing shield-bearers | riders charging past archers], dust, dramatic but not gory, no blood, [STYLE BLOCK]`

### Diving season scenes (4), 1024 x 1536
1. Fitting out: crews loading ropes, water jars and baskets onto pearling boats at dawn.
2. The dive: underwater, a diver descending on a rope with a stone weight, nose clip, net basket, oysters below, light shafts from the surface.
3. The town alone: a half-empty shore town in the heat, women and old men at work, a watchman on the tower.
4. Homecoming: boats returning under sail, crowds on the shore, evening.
Template suffix: `[STYLE BLOCK]`; no recognisable faces.

### Archive illustrations (5 now, 10 later), 1024 x 768
Use the `illustrationBrief` of each page in content/archive/age5.json + `[STYLE BLOCK]`.

### Seven-ages strip (opening), 7 panels at 512 x 1024
One panel per age: oasis and falaj; a town with a mosque and a judge's court (architecture only, no
religious figures); a library of scholars; a dhow under monsoon sail; pearling boats; an airfield
and oil rig on the coast in the 1950s; a federal council building in the late 1960s. Same style
block, joined edge to edge.

## Licence log

For every image you keep, note: tool, plan, date, prompt (copy it), seed or job ID. We record it in
docs/ASSET_INVENTORY.md. Key art (leaders, Rawi, town key art) gets a human paint-over pass before launch.


## Round 5 (2 Nov evening): what the interface v2 needs next

Same style as the twelve buildings (attach one of them as the style reference). Each object alone on
a plain background, no ground tile or water block under it, three-quarter top-down view.

1. **Rawi portrait (RAWI-01), 1024 x 1024.** `an elderly Gulf storyteller (rawi) of the early 1900s, kind lined face, white beard, plain white thobe and a brown bisht, ghutra loosely worn, seated, one hand raised as if telling a story, warm lamplight, head and shoulders, plain parchment background, [STYLE BLOCK]`. Fictional character, no real person.
2. **Decor set (DEC-01..08), 512 x 512 each:** `a single date palm` · `a cluster of three young palms` · `a few sun-bleached rocks` · `a low saltbush shrub` · `a beached small wooden boat` · `a resting camel` · `fishing nets drying on poles` · `a pile of pearl oyster shells`. The game scatters these on empty and locked land so the town looks lived in.
3. **Date grove and fish trap without bases:** the same two buildings with no square stone base and no block of water: just the palms and low wall, and just the reed fences standing in a little water.

## Round 6 (12 Nov): painted pages for The Book of Suhail

Nine illustrations, 4:3, 2048 px wide, same painted-canvas style block as the style frames. Each must
show one bright star low in the sky (Suhail) and leave no text in the image. No recognisable real
person in any of them; Age II shows buildings only, no human figures at all.

| ID | Page | Prompt core |
| --- | --- | --- |
| LORE-01 | The Star Called Suhail | Night desert before dawn, a traveller and camel on a dune ridge seen from behind, one brilliant star just above the southern horizon, amber glow at the horizon |
| LORE-02 | Age of Oases | Iron Age oasis at first light below bare mountains, a stone-lined falaj channel carrying water into date-palm gardens, mud-brick houses, a farmer with a hoe |
| LORE-03 | Age of Faith and Law | Small early Islamic town at dusk, a simple mud-brick mosque with a low dome and a square minaret at its centre, lamplight in arches, empty courtyard, no people |
| LORE-04 | Age of Wisdom | Interior of a 9th-century Baghdad library, shelves of bound manuscripts, a brass astrolabe and open book on a low desk, a great pointed arch open to the night sky, two scholars seen from behind |
| LORE-05 | Age of Sails | A sewn-plank dhow under a full lateen sail on the Indian Ocean at night, two more sails far off, the star and its reflection on the water |
| LORE-06 | Age of Pearls | Split view at the waterline: a pearling boat and hauler above, a diver on a weighted rope below with a nose clip and basket, an open oyster with one pearl on the sand |
| LORE-07 | Age of Oil | Gulf shore at sunset about 1960, an abandoned wooden pearling boat on the sand in front, an offshore drilling rig with a small flare, a tanker on the horizon |
| LORE-08 | Age of Union | Morning of 2 December 1971, the UAE flag on a tall pole over a coastal town of wind-tower houses, a crowd seen from behind, dhows in the bay |
| LORE-09 | Your Turn | A tiny camp on an empty Gulf shore at dawn: one stone well, two palm-frond huts, one small boat on the sand, the star over the sea |
