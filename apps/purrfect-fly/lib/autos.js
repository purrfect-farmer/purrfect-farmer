import BaseAuto from "./BaseAuto.js";
import farmers from "../farmers/index.js";

/**
 * Builds the Auto subclass for a farmer's `static auto` descriptor.
 *
 * `instances` is redeclared per subclass so an operation on one drop never
 * blocks an operation on another for the same user.
 */
export function createAuto(FarmerClass) {
  const { id, title, token, jettonAddress } = FarmerClass.auto;

  return class Auto extends BaseAuto {
    static instances = new Map();
    static farmerId = FarmerClass.id;
    static id = id;
    static title = title;
    static token = token;
    static jettonAddress = jettonAddress;
  };
}

/**
 * Every registered Auto, keyed by auto id (e.g. "atf-auto", "pika-bolt").
 *
 * Discovered from the farmers themselves — a farmer opts in purely by
 * declaring `static auto`.
 *
 * @type {Record<string, ReturnType<typeof createAuto>>}
 */
const autos = {};

for (const FarmerClass of Object.values(farmers)) {
  if (FarmerClass.auto) {
    autos[FarmerClass.auto.id] = createAuto(FarmerClass);
  }
}

export default autos;
