import userAgents, {
  regularMobileUserAgents,
} from "@purrfect/shared/resources/userAgents.js";
import {
  getChromeVersion,
  getFullChromeVersion,
  withChromeVersion,
} from "@purrfect/shared/lib/userAgent/clientHints.js";
import { compareVersions } from "compare-versions";
import { runDatabaseWrite } from "../../lib/db-write.js";

const catalogVersions = userAgents
  .map(getFullChromeVersion)
  .sort(compareVersions);

/** The oldest Chrome major the catalog names */
const OLDEST_CATALOG_MAJOR = Number(catalogVersions[0].split(".")[0]);

/** The newest Chrome version the catalog names */
const NEWEST_CATALOG_VERSION = catalogVersions.at(-1);

/** The user agent moved to the catalog's newest Chrome when it names one older than the catalog */
export function withCurrentChrome(userAgent) {
  const major = Number(getChromeVersion(userAgent));

  return major < OLDEST_CATALOG_MAJOR
    ? withChromeVersion(userAgent, NEWEST_CATALOG_VERSION)
    : userAgent;
}

/** A stable user agent for an account, picked with its seeded RNG */
export function pickUserAgent(platform, random) {
  const list = platform === "telegram" ? userAgents : regularMobileUserAgents;

  return list[Math.floor(random() * list.length)];
}

/**
 * The account's stored user agent on Telegram, else the seeded pick.
 * The pick always draws from the RNG so later seeded values stay the same.
 */
export function resolveUserAgent(account, platform, random) {
  const picked = pickUserAgent(platform, random);

  if (platform === "telegram" && account.userAgent) {
    return withCurrentChrome(account.userAgent);
  }

  return picked;
}

/** Store the runner's user agent on a Telegram account that has none */
export async function ensureUserAgent(runner) {
  const { account } = runner;

  if (runner.platform !== "telegram" || account.userAgent) return;

  await runDatabaseWrite((transaction) =>
    account.update({ userAgent: runner.userAgent }, { transaction }),
  );
}
