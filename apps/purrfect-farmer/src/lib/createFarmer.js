export function createFarmer(options) {
  return {
    ...options,
    tasks: {
      all: Object.keys(options.tasks),
      quick: Object.keys(options.tasks).filter((item) => options.tasks[item]),
    },
  };
}
