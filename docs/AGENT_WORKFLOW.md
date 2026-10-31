# Agent workflow

Six roles. The Director is the main Claude session; the other five are role files in
`.claude/agents/` that the Director invokes for scoped tasks.

## How work flows

1. The Director picks the next task from `docs/TASKS.md`, checks its dependencies, and writes
   acceptance criteria if missing.
2. The Director hands the task to one agent with: the goal, the files to read, the acceptance
   criteria, and what to return.
3. The agent works, commits on the task, and returns a short report: what changed, how it was
   verified, open questions.
4. Code tasks go to QA before they count as done. QA never reviews its own work.
5. The Director checks the evidence (test output, screenshots) and updates the task board.
6. Anything that changes a decision goes to `docs/DECISIONS.md`, and to Filip if it needs approval.

Agents remember nothing between invocations. Everything they need must be in the repository:
CLAUDE.md, the docs, the task board and the code.

## Roles

| Agent | Owns | Must not |
| --- | --- | --- |
| Director | Scope, task board, gates, CLAUDE.md, decisions, communication with Filip | Add scope without logging it; mark work done without evidence |
| Designer | Slice spec, content JSON, balance, economy simulator, mechanics of decision points | Write historical facts (Historian does) |
| Developer | `src/`, `tools/`, integration of assets and content | Put rules in the client; hard-code numbers |
| Creative | Art Bible, interface kit, audio direction, prompt sheets, asset review and processing, asset inventory | Generate volume assets before Gate 1 |
| Historian | Research pack, Archive, questions, Rawi lines, decision-point text, sources, flags | Invent facts or sources; mark text "historian-reviewed" (only a human historian can) |
| QA | Unit and e2e tests, screenshots, performance checks, acceptance checks, bug reports | Review its own code; pass anything not run |

## Parallel and dependent work

| Work | Can start | Waits for |
| --- | --- | --- |
| Research pack, Archive drafts, questions | Now | Nothing |
| Data schemas, roster, economy simulator | Now | Nothing |
| Art Bible, style-frame prompts, audio direction | Now | Nothing (orientation decided: portrait) |
| Core modules (routes, diving, rival, fight, court, ages) | Now | Data schemas for each |
| Volume asset generation | Gate 1 | Art Bible approved |
| Final interface art | After Gate 1 | Interface kit approved |
| Content integration | Week 4 | Schemas fixed |
| Text marked reviewed in the build | Week 9 | A human historian |

## Quality gates

| Gate | Passes when | Approver |
| --- | --- | --- |
| G0 Direction | Phase 1 plan approved | Filip (passed 31 Oct 2026) |
| G1 Creative foundation | Art Bible, three style frames (town, leader portrait, interface screen), theme sketch | Filip |
| G2 Grey box | Whole chapter playable on a phone with placeholder art; simulator shows pacing inside targets | Filip |
| G3 Content complete | All assets integrated, placeholders listed, all text reviewed by a human historian | Filip |
| G4 Release candidate | Definition of Done met, device tests passed, known issues listed, engine decided | Filip |

## Human inputs needed

- Filip: gate approvals; image and music generation from prompt sheets (unless tool domains are
  allowed for agents); device testing on his phones.
- Human historian: review of all historical text before any public playtest.
- Native Arabic writer: Arabic interface text and the Arabic content samples.
- Composer: the main theme.
