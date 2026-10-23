/** Key/value storage kept in the farmer row's `storage` column */
export function createFarmerStorage(runner) {
  return {
    get: async (key) => {
      return runner.farmer?.storage?.[key];
    },
    set: async (key, value) => {
      if (runner.farmer) {
        runner.farmer.storage = {
          ...runner.farmer.storage,
          [key]: value,
        };

        await runner.farmer.save();
      }
    },
  };
}
