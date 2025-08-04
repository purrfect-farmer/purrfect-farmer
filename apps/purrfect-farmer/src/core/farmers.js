const standardFarmers = import.meta.glob("@/drops/*/index.js", {
  eager: true,
  import: "default",
});

const proFarmers = import.meta.glob("@/../pro/src/drops/*/index.js", {
  eager: true,
  import: "default",
});

const farmers = [
  ...Object.values(standardFarmers),
  ...Object.values(proFarmers),
];

export default farmers;
