/**
 * Approved art used by the client. Presentation only: rules never depend on these files.
 * Each entry must have a row in docs/ASSET_INVENTORY.md.
 */
import boardPearlCoast from '../../assets/art/processed/board_pearl-coast_v02.jpg';

/** Board painting per map id. The map's terrain rows were read from this painting. */
export const BOARD_ART: Record<string, string> = {
  'pearl-coast': boardPearlCoast,
};
