import userAgents, {
  regularMobileUserAgents,
} from "@purrfect/shared/resources/userAgents.js";

/** A stable user agent for an account, picked with its seeded RNG */
export function pickUserAgent(platform, random) {
  const list = platform === "telegram" ? userAgents : regularMobileUserAgents;

  return list[Math.floor(random() * list.length)];
}
