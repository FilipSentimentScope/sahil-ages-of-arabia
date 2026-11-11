/**
 * Test content: the shipped buildings and balance with a fixed test map, so unit tests do not
 * break when the playable map changes to follow new board art.
 */
import { loadDefaultContent } from '../../src/core/content-pack';
import { loadContent, type LoadedContent } from '../../src/core/content';

export function testContent(): LoadedContent {
  const c = loadDefaultContent();
  return loadContent({
    buildings: c.buildings,
    balance: c.balance,
    routes: c.routes,
    ageGoals: c.ageGoals,
    questions: c.questions,
    archive: c.archive,
    tasks: c.tasks,
    map: {
      ...c.map,
      id: 'test-map',
      width: 6,
      height: 6,
      rows: ['d....d', '..k...', '..k..s', '......', '......', 'cccccc'],
      openArea: { x: 0, y: 0, size: 6 },
      openGrowthPerAge: 1,
    },
  });
}
