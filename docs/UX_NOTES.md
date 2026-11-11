# UX notes

Playtest feedback and what changed in response. Newest first.

## Filip, 11 Nov 2026 evening

| Feedback | What we changed |
| --- | --- |
| History questions never came up, so they were forgotten | A book chip in the top bar shows questions left today and glows while the Chronicle is open; the Rawi offers a question every few minutes; the next-step bar suggests one earlier; the tutorial has a question step |
| "Always 8/8, should it restart?" (the water counter) | Water now shows how much is free ("4 free"); tapping any resource brings the Rawi out to explain it |
| An avatar for the Rawi that pops out when he explains | Drawn portrait (code-drawn placeholder for a painted one); pops in for every tutorial step and every tip |
| Progress did not open more tiles | Each new rank opens one more row and column of land [RECOMMENDATION]; four ranks take the town from 6 by 6 to 10 by 10 |
| Tutorial should go deeper | 18 steps: the map, each resource, each action button, selling food, tasks, questions, goals, the encyclopedia |
| More people as the town grows | Up to 28 townspeople, scaling with buildings, levels and rank |
| Rebalance tasks, ranks and gifts | In the simulator; results inside GDD targets with no number changes (SIMULATION_NOTES run 5) |

## Revamp, 11 Nov 2026 (interface v3)

Filip asked for a full visual revamp for investors and more interaction.

| Area | What changed | Where |
| --- | --- | --- |
| World | Animated light on the sea and creek; day and night by the game clock with warm window light at night; townspeople walking between buildings; gulls and cloud shadows; buildings bounce when placed or upgraded; soft thrown shadows | `town-view.ts` |
| Interface | Title screen; El Messiri display typeface (Latin and Arabic); painted medallion icons replace emoji for resources and actions; navy and gold panels with a geometric pattern; pressed-button feel; vignette | `styles.css`, `icons.ts`, `main.ts` |
| Interaction | Ready bubbles over buildings: one tap collects; rewards fly to the top bar; sea gifts wash ashore to tap; tasks with rewards and five town ranks (camp to pearl port) with a celebration | `src/core/tasks.ts`, `content/tasks.json`, `main.ts` |

Limits: buildings, ground, Rawi and scenery are still Gemini images or code drawings. Truly
high-fidelity art needs the painted sets in IMAGE_PROMPTS (terrain tiles, decor, Rawi) or an artist.
Tasks, ranks and gifts are a [RECOMMENDATION], not GDD design, and are not in the simulator yet.

## Filip, 3 Nov 2026 morning

| Feedback | What we changed | Where |
| --- | --- | --- |
| Building cards show only cost and description, not what the building gives | Each build card lists what it gives as small tags, generated from the rules: output per hour, water given or used, neighbour bonuses, treasury or storage effect, routes it opens | `describe.ts` (provides), `main.ts` |
| An encyclopedia with search, like the Civilopedia | 📚 Encyclopedia button: search across everything, sections (how to play, buildings, leaders, history, terms, places), entries with an "In the game" box, sources and see-also links. Buildings and Archive pages come live from game data; Archive pages stay locked until a right answer opens them, as the GDD makes them a reward. Six leader pages (Ibn Majid sourced; the other five are the GDD's one-line summaries and say so), 13 terms and 3 places from the research pack, 11 how-to entries. Building info has a "Read more" link | `content/encyclopedia/age5.json`, `src/client/encyclopedia.ts` |

## Filip's second look, 2 Nov 2026 night

| Feedback | What we changed | Where |
| --- | --- | --- |
| The question button fills the Chronicle without asking anything | Real history questions: 14 drafts written from the cited research pack (no labour topic, nothing contested). A card asks the question with three answers in a fixed shuffled order; a right answer gives 40 knowledge, counts for the Chronicle and opens an Archive page; a wrong one shows the answer and explanation and earns nothing, and the question comes back later; 6 a day [GDD]. The Archive reader shows each opened page with sources and a younger-reader version. All marked draft, awaiting a historian | `content/questions/age5.json`, `src/core/age.ts`, `src/client/questions-ui.ts` |
| The music restart is clearly heard; want 5+ minutes and a smoother transition | No more hard loop: the town plays full tracks in turn (town bed, then the main theme sketch), each with its own soft opening and ending, with 6 seconds of quiet between: about 4 minutes before anything repeats. Prompts for three more 3-minute town tracks would make it about 13 minutes. Audio now MP3 so iPhones play it | `src/client/audio.ts`, ELEVENLABS_PROMPTS round 3 |
| Enrich the land outside the town: oasis, palms, ships, dunes | Scenery on locked land, past the map edge and at sea: an oasis near the head of the creek, palms (more near water), rocks, scrub, dune crests, beached boats and dhows drifting on the sea. Drawn in code as placeholders until the painted decor set arrives. Land past the map now continues instead of ending in grey | `src/client/town-view.ts` |

Performance note: the scenery first halved the headless frame rate; static ground and scenery are now
baked into single images, which brought it back (5 fps headless against 6 before; real phones use
the GPU and need their own test, P4-08).

## Filip's first playtest, 2 Nov 2026 (interface v2)

| Feedback | What we changed | Where |
| --- | --- | --- |
| No intro tutorial; add the Rawi as an advisor like in Civilization VI | First-session tutorial in 11 steps with the Rawi: welcome, well, date grove beside it, collect, souq, send the errand, answer its choice, unload, upgrade, the age's goals, done. Steps finish by themselves when the player does what they ask; the control to use glows; Rawi's recorded lines play (English); skip any time, restart from the menu | `src/client/tutorial.ts`, `main.ts` |
| Layout and buttons overwhelming; had to guess what to do | Fewer things on screen: resources at the top, three round actions on the right (Build, Routes, Collect) with badges, settings moved into a menu. A next-step bar at the bottom always suggests one useful action with a Go button | `main.ts`, `guide.ts` |
| Layout should be 16:9 and the map should move | The map fills the whole screen in any shape: phone portrait (9:16) and 16:9 screens. Drag to move, pinch or wheel to zoom, a button to return to the town. Panels slide up on phones and sit at the side on wide screens | `index.html`, `styles.css`, `town-view.ts` |
| No icons for coin, water, food | 🪙 coin, 💧 water, 🍞 food, 📜 knowledge, ⭐ reputation, used everywhere. Emoji stand in until the interface kit (ART-003) is cut | `describe.ts` |
| After an action nothing happens | Every action answers: a banner says what happened and what comes next (for a route: back in 8:00, a choice in 2:40); numbers rise from buildings when collecting; each route out has a timer on the left that lights up when a choice is waiting or it is home | `main.ts`, `routes-panel.ts` |
| Route boxes should show their time, not plain white boxes | Route cards coloured and marked by trip length (errand, day trip by land, day trip by sea, season voyage), with a length gauge, expected coin, number of choices and what they need. Choices open as a card with both options, their odds in words and the average result | `routes-panel.ts` |
| Each building needs information and a hover option | Tap a building: picture, what it does, facts generated from the rules (output, water, neighbour bonuses, where it stands), store and when it fills, collect and upgrade with the gain shown. On a computer, hovering a building shows a tooltip. The build menu shows a picture, cost, one line on what it does and why it is locked | `main.ts`, `describe.ts` |
| Inspiration images (city builders and Civilization Revolution) | Board tilted so the upright building art stands on the ground; hex grid hidden except while placing a building; gold border shows the town's edge like a territory line | `town-view.ts` |

Found by our own phone play-through while building v2, and fixed: the Rawi bubble covered the
buttons it pointed at (it now leaves the action column free and moves to the top when a panel is
open); hidden panels still showed (a style rule overrode "hidden"); a pulsing route marker that
moved was hard to tap (it now glows instead); banners hid behind the advisor (now at the top).

Still open: real interface art (icons, frames, buttons), a Rawi portrait, decorative props
(palms, rocks, boats) so the land looks lived in, and a device test on a mid-range Android phone.
