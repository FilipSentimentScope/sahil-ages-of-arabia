/**
 * First-session tutorial with the Rawi as advisor, in the manner of Civilization VI's advisors
 * (Filip, 2 Nov). Steps follow docs/story/STORY_SCRIPT.md section 1, adapted to what the slice has.
 *
 * Each step either waits for "Next" (information) or finishes by itself when the player has done
 * what it asks (read from the town's state), so it never blocks play. It highlights the control to
 * use. It can be skipped at any time and restarted from the menu. Progress is a preference, not
 * part of the save, so it never touches game rules.
 */
import type { LoadedContent, TownState } from '../core';
import { areNeighbours } from '../core';

export interface TutorialContext {
  town: TownState;
  content: LoadedContent;
  now: number;
  /** Set by the client when the goals sheet has been opened. */
  goalsSeen: boolean;
}

export interface Step {
  id: string;
  quote?: string;
  text: string;
  /** VO-01 line number to play. */
  voice?: string;
  /** Selectors to highlight (whichever exist). */
  highlight: string[];
  /** Done when this is true; information steps have none and wait for "Next". */
  done?: (c: TutorialContext) => boolean;
}

const has = (s: TownState, id: string) => s.buildings.some((b) => b.defId === id);

export const STEPS: Step[] = [
  { id: 'welcome', quote: 'tut.welcome.quote', text: 'tut.welcome.do', voice: '01', highlight: [] },
  { id: 'tour_map', text: 'tut.tour_map', highlight: ['#btn-recenter'] },
  { id: 'tour_resources', text: 'tut.tour_resources', highlight: ['#res'] },
  { id: 'tour_actions', text: 'tut.tour_actions', highlight: ['#dock'] },
  {
    id: 'well', quote: 'tut.well.quote', text: 'tut.well.do', voice: '02',
    highlight: ['#btn-build', '[data-building="well"]'],
    done: ({ town }) => has(town, 'well'),
  },
  {
    id: 'grove', text: 'tut.grove.do', highlight: ['#btn-build', '[data-building="date_grove"]'],
    done: ({ town }) => {
      const wells = town.buildings.filter((b) => b.defId === 'well');
      return town.buildings.some((b) => b.defId === 'date_grove' && wells.some((w) => areNeighbours(w, b))) ||
        town.buildings.filter((b) => b.defId === 'date_grove').length >= 2;
    },
  },
  {
    id: 'collect', quote: 'tut.collect.quote', text: 'tut.collect.do', voice: '09', highlight: ['#btn-collect-all'],
    done: ({ town }) => town.resources.food >= 1 || town.resources.coin > 260 || town.progress.stats.foodSold > 0,
  },
  { id: 'sell', text: 'tut.sell', highlight: ['#chip-food'] },
  {
    id: 'souq', text: 'tut.souq.do', highlight: ['#btn-build', '[data-building="souq"]'],
    done: ({ town }) => has(town, 'souq'),
  },
  {
    id: 'route', quote: 'tut.route.quote', text: 'tut.route.do', voice: '05', highlight: ['#btn-routes', '[data-send="date_gardens"]'],
    done: ({ town }) => town.routes.length > 0 || town.routesToday.count > 0,
  },
  {
    id: 'choice', text: 'tut.choice.do', highlight: ['.tracker.pending', '[data-choose]'],
    done: ({ town }) => town.routes.length === 0 || town.routes.some((r) => r.choices.some((ch) => ch && !ch.auto)),
  },
  {
    id: 'unload', quote: 'tut.unload.quote', text: 'tut.unload.do', voice: '06', highlight: ['.tracker.home', '[data-unload]'],
    done: ({ town }) => town.routes.length === 0,
  },
  {
    id: 'upgrade', quote: 'tut.upgrade.quote', text: 'tut.upgrade.do', voice: '03', highlight: ['#btn-upgrade'],
    done: ({ town }) => town.buildings.some((b) => b.level >= 2),
  },
  {
    id: 'tasks', text: 'tut.tasks', highlight: ['#btn-tasks', '[data-claim]'],
    done: ({ town }) => town.progress.claimed.length >= 1,
  },
  {
    id: 'question', text: 'tut.question', highlight: ['#chip-question'],
    done: ({ town }) => town.age.answered.length + town.age.missed.length >= 1,
  },
  {
    id: 'goals', quote: 'tut.goals.quote', text: 'tut.goals.do', voice: '11', highlight: ['#btn-goals'],
    done: ({ goalsSeen }) => goalsSeen,
  },
  { id: 'encyclopedia', text: 'tut.encyclopedia', highlight: ['#btn-encyclopedia'] },
  { id: 'done', text: 'tut.done', highlight: ['#taskbar'] },
];

/** The first step that is not finished yet, from `from` on (steps already done are passed by). */
export function currentStep(from: number, ctx: TutorialContext): number {
  let i = from;
  while (i < STEPS.length) {
    const st = STEPS[i]!;
    if (!st.done || !st.done(ctx)) return i;
    i++;
  }
  return i;
}
