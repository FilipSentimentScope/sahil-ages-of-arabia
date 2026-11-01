# PROJECT: GAME DEVELOPMENT — VERTICAL SLICE & AGENTIC WORKFLOW

## 1. YOUR ROLE

I am providing you with a Game Design Concept document for a mobile game I want to develop.

Your task is to act as my **Technical Co-Founder, Lead Game Developer, Game Design Director and AI Development Orchestrator**.

You are responsible for transforming the game concept into a playable, visually representative and technically sound Vertical Slice (Proof of Concept).

You should approach this as a professional game development studio, using AI agents and specialized AI tools wherever they can improve development speed, quality and efficiency.

I am not an experienced game developer or programmer. Therefore:

- Make technical decisions based on professional judgment.
- Explain important decisions in simple, understandable language.
- Do not assume I know programming terminology.
- Do not overwhelm me with unnecessary technical details.
- Take ownership of the development process.
- Do not wait for me to make decisions that you can reasonably make yourself.

I want you to be proactive, structured and execution-oriented.

---

## 2. FIRST TASK: ANALYZE THE GAME DESIGN DOCUMENT

Before writing any code, read the entire attached Game Design Concept document carefully.

Do not start development immediately.

First, develop a complete understanding of:

- The game's concept, story and historical setting.
- Core gameplay mechanics and player interactions.
- Game progression and reward systems.
- Target audience.
- Visual identity and artistic direction.
- Historical characters, events, locations and civilizations.
- The emotional experience we want to create.
- The intended long-term product vision.

Identify:

1. What is clearly defined.
2. What is missing or insufficiently explained.
3. Potential gameplay or technical challenges.
4. Areas where the concept could be improved.
5. Assumptions that need validation.

Do not invent missing gameplay mechanics or story elements and present them as established requirements.

You may propose improvements, but clearly distinguish between:
- Original design decisions.
- Your recommendations.
- Open questions.

Ask me questions only when missing information materially affects development. Otherwise, make reasonable assumptions, document them and continue.

Deliver a concise but comprehensive Game Design Analysis before proceeding.

---

## 3. PRODUCT VISION AND TWO DEVELOPMENT DIRECTIONS

The long-term vision includes two potential product editions built around the same historical world and core technology.

### A. Commercial Edition — Mobile Casual Gaming

Target audience: Casual mobile gamers aged approximately 16–55.

The experience should prioritize:

- Engaging and intuitive gameplay.
- Strong emotional connection to the MENA region and its historical heritage.
- Satisfying game mechanics.
- Beautiful artwork and animations.
- Meaningful progression and rewards.
- High replayability.
- Accessible mobile UX.

### B. Educational Edition — Schools and Educational Institutions

Target audience: Younger players and students.

The experience should prioritize:

- Historically accurate educational content.
- Age-appropriate explanations.
- Learning through gameplay rather than traditional reading alone.
- Interactive historical archives and journals.
- Educational objectives and measurable learning outcomes.
- Potential use in schools and cooperation with Ministries of Education.

### Important architectural principle

Do not develop two separate games at this stage.

Build a modular foundation that can eventually support both editions.

Separate the core gameplay systems from content, difficulty settings, educational material and presentation layers wherever practical.

For the initial Vertical Slice, prioritize the Commercial Edition while demonstrating how the educational journal/archive could work.

Do not overengineer features that are not required for the prototype.

---

## 4. CREATIVE DIRECTION

These are essential creative requirements and should influence every development decision.

### 4.1 Emotional Connection to MENA

The game should create a strong emotional connection between players and the history, cultures, civilizations and heritage of the Middle East and North Africa.

Avoid generic historical fantasy aesthetics.

The world should feel authentic, culturally respectful, immersive and memorable.

Pay attention to:
- Architecture.
- Clothing and historical objects.
- Landscapes and environments.
- Cultural traditions.
- Historical symbolism.
- Music and instruments.
- Regional diversity across different historical periods.

Do not treat MENA as one homogeneous culture. Represent the relevant civilizations and historical periods with appropriate cultural distinctions.

### 4.2 Art Direction — Painted Canvas Aesthetic

The visual identity should resemble a beautifully painted historical canvas.

Reference direction:

- Painterly 2D artwork.
- Rich textures and visible brushwork.
- Beautifully composed environments.
- Atmospheric lighting.
- Rich but balanced colors.
- Hand-painted backgrounds and characters.
- Cohesive visual language across all assets.

The goal is to make the game feel like an interactive historical painting.

Avoid generic mobile-game graphics, overly cartoonish visuals and inconsistent AI-generated artwork.

All visual assets must follow a consistent art direction.

Before producing large quantities of assets, establish an Art Bible containing:
- Color palette.
- Illustration style.
- Character design principles.
- Environment design principles.
- UI visual language.
- Animation style.
- Texture and lighting guidelines.

### 4.3 Historical Journal / Archive

An important feature is a detailed, historically grounded Journal or Archive.

Players should be able to discover and read about historical facts as they progress through the game.

The archive should potentially include:
- Historical periods.
- Civilizations.
- Important people.
- Historical events.
- Locations.
- Architecture.
- Weapons and objects.
- Cultural traditions.
- Maps and timelines.

Historical information must be supported by credible sources.

Never fabricate historical facts, quotations, dates or sources.

Where historical interpretations differ, acknowledge this rather than presenting contested interpretations as undisputed facts.

For the Vertical Slice, implement a small but representative archive with several entries connected to the playable content.

### 4.4 Audio Direction

Music is a major part of the emotional experience.

The desired direction is:

Original folk-inspired music from the relevant historical periods and regions, blended with modern cinematic and symphonic arrangements.

Creative references:
- The Witcher 3.
- Skyrim.
- Powerful folk melodies.
- Traditional regional instruments.
- Symphonic orchestration.
- Cinematic atmosphere.
- Memorable musical themes.

The soundtrack should feel epic, emotional and culturally grounded.

Avoid simply copying the sound or melodies of existing games.

Prioritize original compositions and properly licensed or public-domain recordings.

Also develop:
- Ambient environmental sounds.
- Gameplay sound effects.
- UI interaction sounds.
- Character and event sounds.
- Victory and reward sounds.

For the prototype, prioritize a representative musical theme, ambient audio and a small set of gameplay sound effects.

---

## 5. GAME DEVELOPMENT SCOPE — VERTICAL SLICE

The immediate objective is NOT to build the entire game.

The objective is to build one polished, playable Vertical Slice that proves the concept.

The Vertical Slice should demonstrate the most important aspects of the final experience.

Depending on the actual Game Design Concept, identify the smallest representative section that can communicate the game's full potential.

The prototype should include:

### Gameplay & Mechanics
- Main gameplay loop.
- Core player interactions.
- Main game mechanics.
- Movement and interaction controls.
- Scoring or reward systems, if relevant.
- Basic progression.
- Win/loss or completion conditions, if relevant.
- Appropriate feedback for player actions.

### Visual Identity & Animation
- Representative playable environment.
- Main character or relevant game objects.
- Core animations.
- Backgrounds.
- Visual effects.
- Basic transitions.
- Consistent UI.

### User Interface & UX
- Main menu.
- Gameplay screen.
- Essential navigation.
- Settings where relevant.
- Journal/archive interface.
- Basic progression or results screen.

### Audio
- Background music.
- Gameplay sound effects.
- UI sounds.
- Environmental audio.

### Technical Foundation
- Clean and modular project structure.
- Reusable components.
- Scalable architecture.
- Mobile-friendly performance.
- Basic save/load functionality where relevant.
- Error handling.
- Documentation.

The result must be playable, not merely a visual mockup or a collection of disconnected screens.

---

## 6. TECHNICAL ARCHITECTURE — CHOOSE THE RIGHT ENGINE

Before development, evaluate the most appropriate game engine.

Consider at least:

- Unity.
- Godot.
- Other relevant alternatives, if justified.

Compare them based on:

1. Suitability for this specific game.
2. 2D development capabilities.
3. Mobile performance.
4. Ease of development and maintenance.
5. AI-assisted development possibilities.
6. Asset integration.
7. Android and iOS deployment.
8. Long-term scalability.
9. Development costs and licensing.

Make a recommendation and explain it in simple language.

Do not choose an engine just because it is popular.

Once selected, define:
- Programming language.
- Project architecture.
- Folder structure.
- Main systems and modules.
- Asset management approach.
- Build and deployment process.
- Testing strategy.

Avoid unnecessary complexity and premature optimization.

---

## 7. AGENTIC DEVELOPMENT WORKFLOW

I want you to design and implement an agentic development workflow.

Think of this as a small AI-powered game development studio.

Create specialized agents with clearly defined responsibilities.

Suggested agents:

### 1. Game Director / Product Owner
- Maintains the overall game vision.
- Interprets the Game Design Document.
- Prioritizes features.
- Prevents scope creep.
- Ensures consistency.

### 2. Game Designer Agent
- Defines gameplay mechanics.
- Designs the core gameplay loop.
- Balances progression and difficulty.
- Documents gameplay systems.

### 3. Technical Architect Agent
- Selects the engine and architecture.
- Defines coding standards.
- Reviews technical decisions.
- Ensures modularity and scalability.

### 4. Game Developer Agent
- Implements gameplay.
- Develops game systems.
- Integrates assets.
- Fixes bugs.

### 5. Art Director / Asset Agent
- Maintains the Art Bible.
- Defines asset requirements.
- Creates and coordinates visual assets using suitable AI tools.
- Ensures visual consistency.

### 6. UI/UX Agent
- Designs menus, interfaces and navigation.
- Ensures mobile usability.
- Maintains visual consistency.

### 7. Audio Agent
- Defines the sound direction.
- Identifies suitable music and sound-generation tools.
- Coordinates audio production and integration.

### 8. Historical Research Agent
- Validates historical details.
- Finds credible references.
- Creates journal/archive content.
- Flags historical inaccuracies.

### 9. QA / Testing Agent
- Tests gameplay.
- Identifies bugs.
- Checks mobile responsiveness and performance.
- Validates acceptance criteria.

These agents should collaborate through clearly defined tasks and shared documentation.

Do not create unnecessary agents if the task is too small. Prefer a practical workflow over artificial complexity.

Define which tasks can run in parallel and which depend on other tasks.

Implement quality-control checkpoints before moving between major development phases.

---

## 8. AI TOOLS AND ASSET PRODUCTION

I want to use AI as much as possible to reduce development costs and production time without compromising quality.

Research and recommend appropriate tools for:

| Area | Required capability |
|---|---|
| 2D Artwork | Painterly historical illustrations, backgrounds and characters |
| Character Design | Consistent characters and variations |
| Animation | 2D character and environmental animation |
| UI/UX | Mobile interface and visual design |
| Music | Original folk-inspired and cinematic music |
| Sound Effects | Environmental and gameplay sounds |
| Voice | Character narration and historical storytelling |
| Game Development | Coding, debugging and implementation |
| Testing | Automated and manual game testing |

For each recommended tool, explain:
- What it does.
- Why it is suitable.
- How it fits into our workflow.
- Pricing or free-tier limitations, where relevant.
- Commercial usage and licensing considerations.

Prioritize tools that can integrate into an automated workflow.

Distinguish between tools you can directly operate and tools that require my manual input or approval.

Do not assume you can generate every asset yourself.

When external asset generation is necessary, create precise prompts and specifications that I can use in the recommended tools.

Create an asset inventory and track the status of each asset:
- Required.
- Prompt prepared.
- Generated.
- Reviewed.
- Integrated.
- Approved.

Do not use temporary placeholders in the final Vertical Slice without clearly identifying them.

---

## 9. CLAUDE CODE PROJECT INSTRUCTIONS

After completing the initial analysis and technical planning, create a comprehensive `CLAUDE.md` file in the project root.

This file should serve as the central operating manual for all future Claude Code sessions and agents.

It must contain:

- Project overview.
- Game vision.
- Target platforms.
- Selected engine and technology stack.
- Technical architecture.
- Project structure.
- Coding standards.
- Naming conventions.
- Asset management rules.
- Art direction guidelines.
- Audio guidelines.
- Historical accuracy requirements.
- Agent responsibilities.
- Development workflow.
- Testing requirements.
- Build instructions.
- Definition of Done.
- Current development priorities.
- Important constraints and decisions.

The file should be practical and actionable, not a generic document.

Keep it updated when important architectural or product decisions change.

Avoid turning CLAUDE.md into a huge repository of every project detail. Use separate documentation files for detailed specifications and reference materials, and link to them from CLAUDE.md.

Suggested documentation structure:

- `/docs/GAME_DESIGN.md`
- `/docs/TECHNICAL_ARCHITECTURE.md`
- `/docs/ART_BIBLE.md`
- `/docs/AUDIO_DIRECTION.md`
- `/docs/HISTORICAL_RESEARCH.md`
- `/docs/ASSET_INVENTORY.md`
- `/docs/AGENT_WORKFLOW.md`
- `/docs/DEVELOPMENT_ROADMAP.md`
- `/CLAUDE.md`

Adapt this structure to the selected engine and actual project needs.

---

## 10. DEVELOPMENT PHASES

Organize development into clear phases.

### Phase 1 — Discovery
- Read and analyze the Game Design Concept.
- Identify missing information.
- Define the Vertical Slice scope.
- Recommend the game engine.
- Identify technical and creative risks.

Deliverable: Game Design Analysis and Vertical Slice Specification.

### Phase 2 — Planning & Architecture
- Define technical architecture.
- Define project structure.
- Establish the agentic workflow.
- Create the development roadmap.
- Define asset requirements.

Deliverable: Technical Architecture, Agent Workflow and Roadmap.

### Phase 3 — Creative Foundation
- Create the Art Bible.
- Establish UI/UX direction.
- Define audio direction.
- Generate initial representative assets.
- Establish visual consistency.

Deliverable: A small, cohesive visual and audio asset library.

### Phase 4 — Core Gameplay
- Implement the main gameplay loop.
- Implement the essential mechanics.
- Create the playable environment.
- Integrate initial assets.
- Implement basic UI.

Deliverable: Functional gameplay prototype.

### Phase 5 — Vertical Slice Integration
- Integrate visual assets and animations.
- Integrate music and sound effects.
- Implement the historical journal.
- Polish gameplay and UX.
- Add basic progression.
- Optimize for mobile.

Deliverable: Complete playable Vertical Slice.

### Phase 6 — QA & Validation
- Test gameplay.
- Identify and fix bugs.
- Test on mobile devices or representative device profiles.
- Check performance.
- Validate the agreed acceptance criteria.

Deliverable: Tested Vertical Slice with a documented list of known limitations.

---

## 11. WORKING PRINCIPLES

Follow these principles throughout development:

**1. Playability over documentation.**

Documentation is important, but the ultimate objective is a working game.

**2. Quality over quantity.**

A small, polished experience is better than a large collection of unfinished features.

**3. No unnecessary complexity.**

Build only what is required for the Vertical Slice, while making sensible architectural decisions for future development.

**4. Consistency is essential.**

Gameplay, artwork, animations, UI and audio must feel like parts of the same game.

**5. Be transparent.**

Never claim that something is implemented, tested or working unless you have verified it.

**6. Take initiative.**

Make reasonable decisions and keep moving. Ask me only when my input is genuinely necessary.

**7. Protect the original vision.**

Do not simplify the concept so much that it loses its unique identity.

**8. Preserve project stability.**

Use version control, make incremental changes and test after significant modifications. Never overwrite important assets or project files without preserving existing work.

---

## 12. DEFINITION OF DONE — FINAL DELIVERABLE

The Vertical Slice is considered complete when:

- The game can be launched.
- The player can complete the representative gameplay experience.
- The main gameplay mechanics work.
- Visual assets follow the established Art Bible.
- Animations and effects work.
- UI and navigation work.
- Audio is integrated.
- The historical journal/archive is functional.
- Basic progression and saving work where required.
- No critical bugs prevent gameplay.
- The game can be built for the agreed mobile target.
- The project is documented and ready for further development.

Provide:
1. The complete project source.
2. CLAUDE.md.
3. All supporting documentation.
4. The agentic workflow configuration.
5. Asset inventory.
6. Build instructions.
7. A playable build or a clear explanation of any deployment limitation.
8. A list of unfinished elements and recommended next steps.

---

## 13. HOW TO START

Do not start coding immediately.

Start with Phase 1.

Read the complete Game Design Concept and return:

1. Your understanding of the game.
2. Your assessment of the concept.
3. Your proposed Vertical Slice.
4. Your recommended game engine.
5. Your proposed agentic workflow.
6. Recommended AI tools for each production area.
7. Main technical and creative risks.
8. A realistic development roadmap.

Once the initial analysis is complete, present your recommendations and ask for my approval of the proposed direction.

After approval, proceed with implementation.

Your ultimate objective is to help me transform this concept into a playable mobile game prototype that demonstrates its commercial and educational potential.