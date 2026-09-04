import { customLogger } from "@/utils";
import path from "path-browserify";

/**
 * Auto drops — wallet managers built on top of a farmer.
 *
 * A farmer opts in purely by declaring `static auto`, exactly like the cloud
 * side does, so a new drop needs no registration here. Icons are matched by
 * auto id: `assets/images/autos/<auto.id>.png`.
 */
const farmersGlob = import.meta.glob(
  "../../node_modules/@purrfect/shared/farmers/*.js",
  {
    eager: true,
    import: "default",
  },
);

/** Indexes an icon glob by filename, so it can be looked up by id */
const indexIcons = (glob) =>
  Object.entries(glob).reduce((result, [filepath, icon]) => {
    result.set(path.basename(filepath, ".png"), icon);
    return result;
  }, new Map());

/** Tab icon, keyed by auto id */
const autoIcons = indexIcons(
  import.meta.glob("../assets/images/autos/*.png", {
    eager: true,
    import: "default",
    query: { w: 80, h: 80, format: "webp" },
  }),
);

/** Same icon at header size, keyed by auto id */
const autoLargeIcons = indexIcons(
  import.meta.glob("../assets/images/autos/*.png", {
    eager: true,
    import: "default",
    query: { w: 192, h: 192, format: "webp" },
  }),
);

/** The drop's token icon — reuses the farmer's icon, keyed by farmer id */
const tokenIcons = indexIcons(
  import.meta.glob(
    "../../node_modules/@purrfect/shared/assets/images/farmers/*.png",
    {
      eager: true,
      import: "default",
      query: { w: 32, h: 32, format: "webp" },
    },
  ),
);

const autos = Object.values(farmersGlob)
  .filter((Farmer) => Farmer.auto)
  .map((Farmer) => ({
    ...Farmer.auto,
    farmerId: Farmer.id,
    icon: autoIcons.get(Farmer.auto.id),
    largeIcon: autoLargeIcons.get(Farmer.auto.id),
    tokenIcon: tokenIcons.get(Farmer.id),
  }));

const autosMap = autos.reduce((result, auto) => {
  result.set(auto.id, auto);
  return result;
}, new Map());

/**
 * The storage keys holding a drop's wallets.
 *
 * `Auto` reads them through `useSharedStorageState`; the import flow reads
 * another drop's through `storage` directly, so the derivation lives here
 * rather than inline in either.
 */
export function autoStateKeys(config) {
  return {
    master: `${config.storagePrefix}-master`,
    accounts: `${config.storagePrefix}-accounts`,
  };
}

customLogger("AUTOS", autos);

export default autos;
export { autosMap };
