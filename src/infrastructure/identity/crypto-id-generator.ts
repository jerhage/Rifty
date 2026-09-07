import * as Crypto from "expo-crypto";

import type { IdGenerator } from "@/application/ports/id-generator";

/** Version 4 UUIDs from the platform's cryptographically secure random source. */
class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return Crypto.randomUUID();
  }
}

export { CryptoIdGenerator };
