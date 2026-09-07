// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260906170518_initial_catalog/migration.sql';
import m0001 from './20260906173103_add_catalog_seed_state/migration.sql';
import m0002 from './20260906175223_allow_duplicate_riftbound_ids/migration.sql';
import m0003 from './20260906211632_add_card_media_dimensions/migration.sql';
import m0004 from './20260907173253_add_decks/migration.sql';
import m0005 from './20260907173329_enforce_deck_card_quantity/migration.sql';

  export default {
    migrations: {
      "20260906170518_initial_catalog": m0000,
"20260906173103_add_catalog_seed_state": m0001,
"20260906175223_allow_duplicate_riftbound_ids": m0002,
"20260906211632_add_card_media_dimensions": m0003,
"20260907173253_add_decks": m0004,
"20260907173329_enforce_deck_card_quantity": m0005
}
  }
  