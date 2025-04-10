const glob = import.meta.glob("@/drops/space-adventure/index.js", {
  eager: true,
  import: "default",
});

const farmers = Object.values(glob);

export default farmers;
