import { customLogger } from "@/lib/utils";

const glob = import.meta.glob("@/drops/*/index.js", {
  eager: true,
  import: "default",
});

const farmers = Object.values(glob);

customLogger("Farmers", farmers);

export default farmers;
