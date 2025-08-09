import path from "path-browserify";
import { createFarmer } from "@/lib/createFarmer";

const farmersGlob = import.meta.glob(
  "../../node_modules/@purrfect/shared/farmers/*.js",
  {
    eager: true,
    import: "default",
  }
);

const farmersIconGlob = import.meta.glob("../assets/images/farmers/*.png", {
  eager: true,
  import: "default",
  query: {
    w: 80,
    h: 80,
    format: "webp",
  },
});

const icons = Object.entries(farmersIconGlob).reduce(
  (result, [filepath, icon]) => {
    result.set(path.basename(filepath, ".png"), icon);
    return result;
  },
  new Map()
);

const farmers = Object.values(farmersGlob).map((Farmer) =>
  createFarmer(Farmer, {
    icon: icons.get(Farmer.id),
  })
);

export default farmers;
