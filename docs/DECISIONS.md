# Decision log

Newest first. Each entry: date, decision, who decided, reason, where it is applied.

| Date | Decision | Decided by | Reason | Applied in |
| --- | --- | --- | --- | --- |
| 2026-11-03 | Public tester link on GitHub Pages (the repository is already public) | Filip (asked for an external link) | Testers need no account; history content stays marked draft, so this is a preview for invited people, not the public playtest that needs historian review | tools/publish-pages.sh |
| 2026-11-02 | Interface v2 after Filip's playtest: map fills the screen in any shape (phone portrait and 16:9), floating interface, Rawi tutorial, next-step bar, action feedback, themed route cards, building info and hover; board tilted, grid shown only while placing | Filip (feedback), Claude (design) | "16:9 layout" read as: no narrow column, the map fills the screen; one layout serves phones and wide screens. See docs/UX_NOTES.md | src/client, index.html |
| 2026-11-02 | Balance pass P2-10 adopted: goal costs, route cargo that grows with the town, treasury room for cargo and 2 collections, decisions open until unloading | Claude (Director); assumptions listed for Filip | Meets the GDD's Age V length and player-type ratios in simulation | SIMULATION_NOTES run 4, content/age5-goals.json, routes.json, balance.json |
| 2026-11-02 | Town board uses pointy-top hexes (as in Civilization), six neighbours; the GDD cap of four helpful neighbours still applies | Filip | Hexes read more naturally and make placement a richer puzzle | src/core/hex.ts, settlement, town-view |
| 2026-11-02 | The whole 12 by 12 map is drawn from the start; the open block (6 by 6 in the slice) is fenced in gold and the rest is greyed out until it opens, one row and one column per age change | Filip, following GDD section 15 | Player sees where the town will grow | content/maps/pearl-coast.json, settlement (openArea, growTown) |
| 2026-11-02 | Buildings sit centred on their hex at about 80% of its width, so ground and grid stay visible | Filip | Readability; the board should not look crowded | town-view |
| 2026-11-02 | Building art keeps the illustrated look of the 2 Nov sheet (soft outlines), ground stays painterly | Filip (sent the full set of twelve in this style) | One consistent set; readable at phone size. Supersedes the 'no outlines' line for buildings only | ART_BIBLE section 3 |
| 2026-11-02 | Square board painting retired; ground drawn from map data until painted terrain tiles arrive | Claude (Director) | A square painting cannot follow a hex map; tiles survive any map change | assets/art/processed/archive, art.ts |
| 2026-11-01 | Gate 1 passed: art direction approved, ART-001 v2 (town key art) is the style reference for all art | Filip | Round 2 frames approved; see docs/reviews/GATE1_REVIEW_2026-11-01.md | ART_BIBLE, prompts |
| 2026-11-01 | (Superseded 2 Nov by the hex map) Map data follows the approved board painting (not the other way round) | Claude (Director) | Avoids repainting; terrain read cell by cell, at least 12 open plots kept | content/maps/pearl-coast.json |
| 2026-11-01 | Agents draft history, music direction and story themselves until historians, a composer and writers are hired after funding; drafts stay marked 'draft' | Filip | Keep momentum before funding | HISTORICAL_RESEARCH, AUDIO_DIRECTION, docs/story |
| 2026-11-01 | Code lives at github.com/FilipSentimentScope/sahil-ages-of-arabia | Filip | Durable record beyond the temporary workspace | Repository |
| 2026-10-31 | Slice text is English first, with Arabic interface strings and right-to-left layout | Claude (recommendation, not contested by Filip) | Keeps Arabic quality honest until a native writer joins | i18n, content/ar |
| 2026-10-31 | (Widened 2 Nov: the layout now also fills 16:9 screens) Portrait orientation | Claude (recommendation, not contested by Filip) | One-handed play in short visits; must be fixed before the Art Bible | Layout, Art Bible |
| 2026-10-31 | Remove "demand their return" for indebted divers from the slice; Archive treatment of pearl-diving labour referred to the advisor | Filip | Historical sensitivity: enslaved and indebted divers (Hopper, *Slaves of One Master*, 2015) | GAME_DESIGN section 4 |
| 2026-10-31 | Slice framed as a new pearling town in Age V, "The Pearl Coast" | Filip | Resolves five contradictions in GDD section 24 | GAME_DESIGN |
| 2026-10-31 | Web stack for the slice; production engine decided at Gate 4 | Filip | Agents can build and verify every change; shareable link; engine choice with device data | TECHNICAL_ARCHITECTURE |
| 2026-10-31 | Two time modes: Showcase and Playtest | Filip (approved with plan) | Demos need compression; the tranche 2 test needs real timers | core/clock, balance.json |
| 2026-10-31 | Six agents instead of nine | Filip (approved with plan) | Fewer handovers, less repeated context | AGENT_WORKFLOW |

## Pending decisions

| Item | Needed by | Notes |
| --- | --- | --- |
| Image and audio tool subscriptions; allow their domains for agents? | Week 2 | Filip uses Google Gemini on a paid plan for images, music and the Rawi voice (2 Nov). Commercial terms to confirm before public release; see ASSET_INVENTORY licence note |
| Historian, Arabic writer, composer | After funding | Agents draft until then (decision of 1 Nov 2026); human review still required before any public playtest |
