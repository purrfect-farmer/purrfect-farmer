import * as core from "./core.js";
import * as dateFns from "date-fns";
import * as delay from "./delay.js";
import * as ecosystem from "./ecosystem.js";
import * as telegram from "./telegram.js";

const utils = {
  dateFns,
  ...ecosystem,
  ...delay,
  ...telegram,
  ...core,
};

export default utils;
