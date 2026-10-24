import { getUserAgent } from "@/utils";
import { withChromeVersion } from "@purrfect/shared/lib/userAgent/clientHints";

/** The running browser's full Chrome version, read once */
let engineChromeVersion = null;

/** Read the running browser's full Chrome version, or null outside Chromium */
async function readEngineChromeVersion() {
  try {
    const { fullVersionList } =
      await navigator.userAgentData.getHighEntropyValues(["fullVersionList"]);
    const chromium = fullVersionList.find(({ brand }) => brand === "Chromium");

    if (chromium) return chromium.version;
  } catch {}

  return navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? null;
}

/** The running browser's full Chrome version, or null outside Chromium */
export function getEngineChromeVersion() {
  engineChromeVersion ??= readEngineChromeVersion();

  return engineChromeVersion;
}

/** The account's user agent, naming the running browser's Chrome version */
export async function getEngineUserAgent() {
  const [userAgent, chromeVersion] = await Promise.all([
    getUserAgent(),
    getEngineChromeVersion(),
  ]);

  return withChromeVersion(userAgent, chromeVersion);
}
