import "./config/env.js";

import { proxyManager } from "./lib/index.js";
import utils from "./lib/utils.js";

const { chalk, inquirer } = utils;

/* Main function */
const main = async () => {
  /* Log the getting working proxies message */
  console.log(chalk.blue(`Getting working proxies...`));

  /* Get Working Proxies */
  const proxies = await proxyManager.getWorkingProxies();

  /* Log the number of working proxies */
  console.log(chalk.green(`Found ${proxies.length} working proxies`));
};

main();
