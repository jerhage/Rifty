import type { SetFinder } from "@/features/set/set-finder";
import type { SetLister } from "@/features/set/set-lister";
import { findSet } from "@/features/set/use-cases/find-set";
import { listSets } from "@/features/set/use-cases/list-sets";
import { setCodeSchema } from "@/features/set/value-objects/set-code";

const STORE_FAILURE = new Error("The store is unavailable.");

const failingSetFinder: SetFinder = { get: () => Promise.reject(STORE_FAILURE) };
const failingSetLister: SetLister = { getAll: () => Promise.reject(STORE_FAILURE) };

describe("set read use cases", () => {
  it("should reject rather than answer when finding a set fails", async () => {
    await expect(findSet(setCodeSchema.parse("UNL"), { setFinder: failingSetFinder })).rejects.toBe(
      STORE_FAILURE,
    );
  });

  it("should reject rather than answer when listing sets fails", async () => {
    await expect(listSets({ setLister: failingSetLister })).rejects.toBe(STORE_FAILURE);
  });
});
