import * as core from "./core.js";
import * as dateFns from "date-fns";
import * as delay from "./delay.js";
import * as telegram from "./telegram.js";

const utils = {
  dateFns,
  ...delay,
  ...telegram,
  ...core,
};

export default utils;
