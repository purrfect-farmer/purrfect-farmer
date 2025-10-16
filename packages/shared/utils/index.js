export * from "./core.js";
export * from "./delay.js";
export * from "./telegram.js";

import * as dateFns from "date-fns";

import * as core from "./core.js";
import * as delay from "./delay.js";
import * as telegram from "./telegram.js";

import CryptoJS from "crypto-js";

export { CryptoJS };

export default {
  dateFns,
  CryptoJS,
  ...delay,
  ...telegram,
  ...core,
};
