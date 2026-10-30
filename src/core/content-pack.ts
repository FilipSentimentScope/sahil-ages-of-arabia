/** Bundles the JSON content files into one validated pack. Used by the client, tests and tools. */
import buildingsFile from '../../content/buildings.json';
import balanceFile from '../../content/balance.json';
import mapFile from '../../content/maps/pearl-coast.json';
import { loadContent, type LoadedContent } from './content';
import type { BalanceConfig, BuildingDef, MapDef } from './types';

export function loadDefaultContent(): LoadedContent {
  return loadContent({
    buildings: buildingsFile.buildings as BuildingDef[],
    balance: balanceFile as unknown as BalanceConfig,
    map: mapFile as unknown as MapDef,
  });
}
