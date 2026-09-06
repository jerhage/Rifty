// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260906170518_initial_catalog/migration.sql';
import m0001 from './20260906173103_add_catalog_seed_state/migration.sql';
import m0002 from './20260906175223_allow_duplicate_riftbound_ids/migration.sql';

  export default {
    migrations: {
      "20260906170518_initial_catalog": m0000,
"20260906173103_add_catalog_seed_state": m0001,
"20260906175223_allow_duplicate_riftbound_ids": m0002
}
  }
  