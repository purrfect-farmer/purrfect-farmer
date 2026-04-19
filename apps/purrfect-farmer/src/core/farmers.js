import { createFarmer } from "@/lib/createFarmer";
import { customLogger } from "@/utils";
import path from "path-browserify";

const farmersGlob = import.meta.glob(
  "../../node_modules/@purrfect/shared/farmers/*.js",
  {
    eager: true,
    import: "default",
  },
);

const farmersIconGlob = import.meta.glob(
  "../../node_modules/@purrfect/shared/assets/images/farmers/*.png",
  {
    eager: true,
    import: "default",
    query: {
      w: 80,
      h: 80,
      format: "webp",
    },
  },
);

const farmerIcons = Object.entries(farmersIconGlob).reduce(
  (result, [filepath, icon]) => {
    result.set(path.basename(filepath, ".png"), icon);
    return result;
  },
  new Map(),
);

const farmers = Object.values(farmersGlob).map((Farmer) =>
  createFarmer(Farmer, {
    icon: farmerIcons.get(Farmer.id),
  }),
);

const farmersMap = farmers.reduce((result, farmer) => {
  result.set(farmer.id, {
    title: farmer.title,
    icon: farmer.icon,
    singleton: farmer.singleton,
    FarmerClass: farmer.FarmerClass,
  });
  return result;
}, new Map());

customLogger("FARMERS", farmers);
customLogger("FARMERS MAP", farmersMap);

export default farmers;
export { farmersMap };
