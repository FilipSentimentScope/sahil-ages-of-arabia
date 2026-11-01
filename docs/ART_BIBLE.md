# Art Bible (draft v0.1)

Status: **draft v0.1**, written by the Creative agent on 1 Nov 2026. Approved at Gate 1 together
with the three style frames. No volume asset generation before approval.
Prompts that apply this bible: [assets/prompts/IMAGE_PROMPTS.md](../assets/prompts/IMAGE_PROMPTS.md).

## 1. The look in one sentence

An interactive historical painting: a sunlit Gulf shore painted in oil and gouache, with visible,
confident brushwork, soft atmosphere and a restrained, warm palette, where every object is something
that existed on that coast.

## 2. Palette

| Role | Colours (approximate) | Use |
| --- | --- | --- |
| Ground | Sand ochre #D9C29A, pale sabkha #ECE4D2, dune gold #E2C47E | Terrain, walls, parchment |
| Sea | Shallow turquoise #8FC7C2, sea teal #3E8C8A, deep indigo #23395B | Water, shadows, night |
| Coral and gypsum | Coral white #F1E9DC, gypsum grey #CFC6B8 | Stone houses, fort |
| Palm | Frond green #6E7F4A, dry frond #A88F5A, trunk brown #6B4E32 | Groves, arish houses |
| Accent | Pearl lustre #F4EFE6 with pink-green sheen, brass #B08A3E, indigo dye #2E3F73 | Rewards, interface highlights |
| Warning | Burnt madder #A4462C | Danger, storms, raids |

Light: late-afternoon sun from the upper left for daytime scenes; night scenes in deep indigo with
warm lantern light. Saturation stays moderate; only pearls, rewards and the accent may glow.

## 3. Illustration style

- Painterly, not photographic and not cartoon. Brushstrokes visible on larger assets; edges simplified
  on small assets so they read at 56 px.
- Canvas or paper grain is part of the look; apply it consistently (a shared texture overlay in the
  client is preferable to baking different grain into every image).
- Detail scales with size: buildings and icons have fewer, larger shapes; backgrounds and Archive
  illustrations carry the fine detail.
- No outlines in black; forms are separated by value and colour, like a painting.

## 4. Character design

- Proportions natural and adult; faces dignified, never caricatured.
- Real people: no authentic portraits exist for any of the six slice leaders. Each portrait is an
  artistic interpretation based on period, place and role, and the Archive says so. Never claim a likeness.
- Dress by period and place: a fifteenth-century navigator from Julfar does not wear the same clothes
  as a third-century queen of Palmyra or a fourteenth-century traveller from Tangier. The Historian
  checks every costume brief.
- The Rawi is invented: an elderly coastal storyteller in plain, period-appropriate dress.
- Group C figures never appear (CLAUDE.md rule 5).

## 5. Environment design (Age V, lower Gulf coast)

- Most houses are palm-frond **arish**; a few coral-stone courtyard houses with gypsum mortar; at most
  one or two wind towers (**barjeel**), on wealthy houses only (research pack: wind towers in surviving
  Dubai houses are mostly early twentieth century).
- Shore: shallow turquoise water, sandbanks, mangrove poles, fish traps, wooden pearling boats with
  lateen sails drawn up on the sand. Boat types to be confirmed by a historian; until then prompts say
  "wooden Gulf pearling boat with a lateen sail" rather than naming a type.
- Diving equipment: horn or turtle-shell nose clip, stone weight (lead only near the end of the era),
  rope net basket, leather finger guards (research pack).
- Terrain types: open sand, shore, creek, dune, salt flat (sabkha); readable at grid size, with gentle
  texture, not noisy.

## 6. Interface visual language

- Panels look like aged paper or plaster with thin brass-coloured rules; corners and dividers use
  geometry drawn from **sadu** weaving and carved gypsum screens, never mosque calligraphy or Quranic text.
- Type: Latin and Arabic paired, both highly readable on phones (candidates: Noto Naskh Arabic or IBM
  Plex Sans Arabic with Inter, to test). Arabic text is never used as decoration.
- Icons: painted, simple silhouettes with one highlight; coin follows the age's money (Maria Theresa
  thaler style for Age V, to confirm); pearl icon for Dana.
- Touch targets at least 44 px; text never drawn into images, always live text.

## 7. Animation style

- Subtle, painterly motion done in code where possible: water shimmer, palm sway, smoke, sails, cloth,
  lantern flicker, parallax between layers.
- Fights are painted tableaux with limited motion (dust, banners, a push forward) and a clear counter overlay.
- Rewards: a brief pearl-light sparkle, never casino-style explosions.

## 8. Texture and lighting

- One shared light direction per scene type (above). Soft shadows, warm bounce light from sand.
- No lens flares, no bloom, no glossy materials, no 3D rendering look.

## 9. Reference pack (sources for artists and prompts)

- Museum objects: Qatar Museums nose clip and diver's weight records; Abu Dhabi Heritage Register,
  "Diving Equipment in the Past" (research pack S1 to S3).
- Architecture: Al Fahidi (Dubai) and Al Shindagha coral-stone houses; arish reconstructions in heritage villages.
- UNESCO "Pearling, Testimony of an Island Economy" (Muharraq) for merchant houses and the shoreline.
- Historic photographs of pearling crews exist in public archives; use them for reference only, check
  rights, and never trace them.

## 10. Banned elements

Generic "Arabian Nights": genies, magic lamps, flying carpets, belly dancers, harem scenes. Onion domes,
Mughal or Ottoman palaces, Taj Mahal silhouettes. European galleons in Gulf scenes (except the
Portuguese in Age IV context). Camels on boats, deserts with no water source next to a town. Modern
buildings, concrete, electric light, plastic. Arabic gibberish text. Swords as decoration on everyone.
Women shown only as background or exoticised. Sexualised or demeaning depictions of anyone. Depictions
of the Prophet, companions or any religious figure.

## 11. Prompt template

See assets/prompts/IMAGE_PROMPTS.md: one **style block** and one **negative block** reused in every
prompt, plus a **subject block** per asset. After Gate 1, approved frames train a Scenario style model,
and production assets are generated from that model for consistency.
