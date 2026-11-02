# UX notes

Playtest feedback and what changed in response. Newest first.

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
