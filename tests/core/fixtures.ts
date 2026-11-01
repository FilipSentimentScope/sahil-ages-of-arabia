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
    map: {
      ...c.map,
      id: 'test-map',
      rows: ['d....d', '..k...', '..k..s', '......', '......', 'cccccc'],
    },
  });
}
