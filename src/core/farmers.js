const glob = import.meta.glob("@/drops/*/index.js", {
  eager: true,
  import: "default",
});

const farmers = Object.values(glob);

export default farmers;
