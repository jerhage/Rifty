const coreRulesKeys = {
  all: () => ["coreRules"] as const,
  document: () => [...coreRulesKeys.all(), "document"] as const,
  edition: () => [...coreRulesKeys.all(), "edition"] as const,
};

export { coreRulesKeys };
