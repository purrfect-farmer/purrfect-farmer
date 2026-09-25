import bundledSharedUtils from "@purrfect/shared/utils/bundle.js";
import * as dcUtils from "@purrfect/shared/utils/dc.js";
import * as httpUtils from "@purrfect/shared/utils/http.js";
import chalk from "chalk";
import inquirer from "inquirer";

export default {
  ...bundledSharedUtils,
  ...dcUtils,
  ...httpUtils,
  chalk,
  inquirer,
};
