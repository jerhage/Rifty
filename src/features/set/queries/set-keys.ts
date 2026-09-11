const setKeys = {
  all: () => ["set"] as const,
  list: () => [...setKeys.all(), "list"] as const,
};

export { setKeys };
