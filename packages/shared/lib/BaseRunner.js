import utils from "../utils/bundle.js";

export default function createBaseRunner(FarmerClass) {
  return class Runner extends FarmerClass {
    static utils = utils;
  };
}
