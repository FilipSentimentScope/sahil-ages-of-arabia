/**
 * Approved or candidate art used by the client. Presentation only: rules never depend on these
 * files. Each entry must have a row in docs/ASSET_INVENTORY.md.
 *
 * The square-grid board painting (board_pearl-coast_v02) was retired on 2 Nov 2026 when the town
 * moved to hexes; the terrain is now drawn from map data until a hex-friendly ground painting
 * arrives (terrain tiles in assets/prompts/IMAGE_PROMPTS.md).
 */
import barastiHouse from '../../assets/art/processed/buildings/bld_barasti-house_age5_v02.png';
import dateGrove from '../../assets/art/processed/buildings/bld_date-grove_age5_v02.png';
import fishTrap from '../../assets/art/processed/buildings/bld_fish-trap_age5_v02.png';
import jetty from '../../assets/art/processed/buildings/bld_jetty_age5_v02.png';
import majlis from '../../assets/art/processed/buildings/bld_majlis_age5_v02.png';
import pearlMerchant from '../../assets/art/processed/buildings/bld_pearl-merchant_age5_v02.png';
import scribeHouse from '../../assets/art/processed/buildings/bld_scribe-house_age5_v02.png';
import souq from '../../assets/art/processed/buildings/bld_souq_age5_v02.png';
import storehouse from '../../assets/art/processed/buildings/bld_storehouse_age5_v02.png';
import treasury from '../../assets/art/processed/buildings/bld_treasury_age5_v02.png';
import watchtower from '../../assets/art/processed/buildings/bld_watchtower_age5_v02.png';
import well from '../../assets/art/processed/buildings/bld_well_age5_v02.png';

/** Building art per building id (Age V). Buildings missing here show the grey-box placeholder. */
export const BUILDING_ART: Record<string, string> = {
  well,
  date_grove: dateGrove,
  fish_trap: fishTrap,
  barasti_house: barastiHouse,
  souq,
  jetty,
  pearl_merchant: pearlMerchant,
  majlis,
  scribe_house: scribeHouse,
  watchtower,
  treasury,
  storehouse,
};
