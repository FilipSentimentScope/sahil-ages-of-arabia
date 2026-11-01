# Decision log

Newest first. Each entry: date, decision, who decided, reason, where it is applied.

| Date | Decision | Decided by | Reason | Applied in |
| --- | --- | --- | --- | --- |
| 2026-11-01 | Gate 1 passed: art direction approved, ART-001 v2 (town key art) is the style reference for all art | Filip | Round 2 frames approved; see docs/reviews/GATE1_REVIEW_2026-11-01.md | ART_BIBLE, prompts |
| 2026-11-01 | Map data follows the approved board painting (not the other way round) | Claude (Director) | Avoids repainting; terrain read cell by cell, at least 12 open plots kept | content/maps/pearl-coast.json |
| 2026-11-01 | Agents draft history, music direction and story themselves until historians, a composer and writers are hired after funding; drafts stay marked 'draft' | Filip | Keep momentum before funding | HISTORICAL_RESEARCH, AUDIO_DIRECTION, docs/story |
| 2026-11-01 | Code lives at github.com/FilipSentimentScope/sahil-ages-of-arabia | Filip | Durable record beyond the temporary workspace | Repository |
| 2026-10-31 | Slice text is English first, with Arabic interface strings and right-to-left layout | Claude (recommendation, not contested by Filip) | Keeps Arabic quality honest until a native writer joins | i18n, content/ar |
| 2026-10-31 | Portrait orientation | Claude (recommendation, not contested by Filip) | One-handed play in short visits; must be fixed before the Art Bible | Layout, Art Bible |
| 2026-10-31 | Remove "demand their return" for indebted divers from the slice; Archive treatment of pearl-diving labour referred to the advisor | Filip | Historical sensitivity: enslaved and indebted divers (Hopper, *Slaves of One Master*, 2015) | GAME_DESIGN section 4 |
| 2026-10-31 | Slice framed as a new pearling town in Age V, "The Pearl Coast" | Filip | Resolves five contradictions in GDD section 24 | GAME_DESIGN |
| 2026-10-31 | Web stack for the slice; production engine decided at Gate 4 | Filip | Agents can build and verify every change; shareable link; engine choice with device data | TECHNICAL_ARCHITECTURE |
| 2026-10-31 | Two time modes: Showcase and Playtest | Filip (approved with plan) | Demos need compression; the tranche 2 test needs real timers | core/clock, balance.json |
| 2026-10-31 | Six agents instead of nine | Filip (approved with plan) | Fewer handovers, less repeated context | AGENT_WORKFLOW |

## Pending decisions

| Item | Needed by | Notes |
| --- | --- | --- |
| Image and audio tool subscriptions; allow their domains for agents? | Week 2 | Otherwise Filip generates from prompt sheets |
| Historian, Arabic writer, composer | After funding | Agents draft until then (decision of 1 Nov 2026); human review still required before any public playtest |
