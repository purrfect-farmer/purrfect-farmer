import * as core from "./core.js";
import * as dateFns from "date-fns";
import * as delay from "./delay.js";
import * as ecosystem from "./ecosystem.js";
import * as telegram from "./telegram.js";
import * as ton from "./ton.js";

/** `ton` stays out of index.js, so @ton/core never reaches the content scripts */
const utils = {
  dateFns,
  ...ecosystem,
  ...delay,
  ...telegram,
  ...ton,
  ...core,
};

export default utils;
