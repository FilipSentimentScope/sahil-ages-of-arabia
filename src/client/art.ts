/**
 * Approved or candidate art used by the client. Presentation only: rules never depend on these
 * files. Each entry must have a row in docs/ASSET_INVENTORY.md.
 */
import boardPearlCoast from '../../assets/art/processed/board_pearl-coast_v02.jpg';
import jetty from '../../assets/art/processed/buildings/bld_jetty_age5_v01.png';
import majlis from '../../assets/art/processed/buildings/bld_majlis_age5_v01.png';
import pearlMerchant from '../../assets/art/processed/buildings/bld_pearl-merchant_age5_v01.png';
import scribeHouse from '../../assets/art/processed/buildings/bld_scribe-house_age5_v01.png';
import storehouse from '../../assets/art/processed/buildings/bld_storehouse_age5_v01.png';
import treasury from '../../assets/art/processed/buildings/bld_treasury_age5_v01.png';
import watchtower from '../../assets/art/processed/buildings/bld_watchtower_age5_v01.png';

/** Board painting per map id. The map's terrain rows were read from this painting. */
export const BOARD_ART: Record<string, string> = {
  'pearl-coast': boardPearlCoast,
};

/** Building art per building id (Age V). Buildings missing here show the grey-box placeholder. */
export const BUILDING_ART: Record<string, string> = {
  jetty,
  majlis,
  pearl_merchant: pearlMerchant,
  scribe_house: scribeHouse,
  storehouse,
  treasury,
  watchtower,
};
