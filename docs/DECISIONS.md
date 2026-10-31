# Decision log

Newest first. Each entry: date, decision, who decided, reason, where it is applied.

| Date | Decision | Decided by | Reason | Applied in |
| --- | --- | --- | --- | --- |
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
| Private GitHub repository | Week 1 | No repositories are visible to this workspace yet |
| Image and audio tool subscriptions; allow their domains for agents? | Week 2 | Otherwise Filip generates from prompt sheets |
| Historian, Arabic writer, composer | Weeks 6 to 8 | GDD open decision 2: the historian is the first hire |
