/** Bundles the JSON content files into one validated pack. Used by the client, tests and tools. */
import buildingsFile from '../../content/buildings.json';
import balanceFile from '../../content/balance.json';
import mapFile from '../../content/maps/pearl-coast.json';
import routesFile from '../../content/routes.json';
import ageGoalsFile from '../../content/age5-goals.json';
import questionsFile from '../../content/questions/age5.json';
import archiveFile from '../../content/archive/age5.json';
import { loadContent, type LoadedContent } from './content';
import type { AgeGoalsConfig, ArchiveConfig, BalanceConfig, BuildingDef, MapDef, QuestionsConfig, RoutesConfig } from './types';

export function loadDefaultContent(): LoadedContent {
  return loadContent({
    buildings: buildingsFile.buildings as BuildingDef[],
    balance: balanceFile as unknown as BalanceConfig,
    map: mapFile as unknown as MapDef,
    routes: routesFile as unknown as RoutesConfig,
    ageGoals: ageGoalsFile as unknown as AgeGoalsConfig,
    questions: questionsFile as unknown as QuestionsConfig,
    archive: archiveFile as unknown as ArchiveConfig,
  });
}
