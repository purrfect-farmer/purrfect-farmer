import userAgents, {
  regularMobileUserAgents,
} from "@purrfect/shared/resources/userAgents.js";
import { runDatabaseWrite } from "../../lib/db-write.js";

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
    return account.userAgent;
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
