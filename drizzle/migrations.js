// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260906170518_initial_catalog/migration.sql';
import m0001 from './20260906173103_add_catalog_seed_state/migration.sql';
import m0002 from './20260906175223_allow_duplicate_riftbound_ids/migration.sql';
import m0003 from './20260906211632_add_card_media_dimensions/migration.sql';
import m0004 from './20260907173253_add_decks/migration.sql';
import m0005 from './20260907173329_enforce_deck_card_quantity/migration.sql';
import m0006 from './20260907180450_enforce_unique_deck_names/migration.sql';
import m0007 from './20260908192826_add_deck_chosen_champion/migration.sql';
import m0008 from './20260908194829_move_champion_into_main_deck/migration.sql';
import m0009 from './20260908234101_add_card_keywords_speeds_and_tag_kinds/migration.sql';
import m0010 from './20260908234505_replace_card_media_assets_with_owned_images/migration.sql';
import m0011 from './20260909193131_fair_hedge_knight/migration.sql';
import m0012 from './20260909220154_youthful_mad_thinker/migration.sql';
import m0013 from './20260909225448_wealthy_living_tribunal/migration.sql';

  export default {
    migrations: {
      "20260906170518_initial_catalog": m0000,
"20260906173103_add_catalog_seed_state": m0001,
"20260906175223_allow_duplicate_riftbound_ids": m0002,
"20260906211632_add_card_media_dimensions": m0003,
"20260907173253_add_decks": m0004,
"20260907173329_enforce_deck_card_quantity": m0005,
"20260907180450_enforce_unique_deck_names": m0006,
"20260908192826_add_deck_chosen_champion": m0007,
"20260908194829_move_champion_into_main_deck": m0008,
"20260908234101_add_card_keywords_speeds_and_tag_kinds": m0009,
"20260908234505_replace_card_media_assets_with_owned_images": m0010,
"20260909193131_fair_hedge_knight": m0011,
"20260909220154_youthful_mad_thinker": m0012,
"20260909225448_wealthy_living_tribunal": m0013
}
  }
  