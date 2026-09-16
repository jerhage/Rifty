// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260911185741_initial_schema/migration.sql';
import m0001 from './20260916003312_core_rules/migration.sql';
import m0002 from './20260916004202_core_rules_seed_state/migration.sql';

  export default {
    migrations: {
      "20260911185741_initial_schema": m0000,
"20260916003312_core_rules": m0001,
"20260916004202_core_rules_seed_state": m0002
}
  }
  