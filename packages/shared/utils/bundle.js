import * as dateFns from "date-fns";
import * as core from "./core.js";
import * as delay from "./delay.js";
import * as telegram from "./telegram.js";

export default {
  dateFns,
  ...delay,
  ...telegram,
  ...core,
};
