import {
  getBrands,
  getFullChromeVersion,
} from "@purrfect/shared/lib/userAgent/clientHints";

import { defineNativeGetter, wrapNativeMethod } from "./native";

/** The values `getHighEntropyValues` resolves for the phone */
function getHighEntropyValues({ profile, userAgent }) {
  const fullVersion = getFullChromeVersion(userAgent);
  const fullVersionList = getBrands(userAgent).map(({ brand, version }) => ({
    brand,
    version: brand.startsWith("Not") ? `${version}.0.0.0` : fullVersion,
  }));

  return {
    architecture: profile.ua.arch,
    bitness: profile.ua.bitness,
    formFactors: ["Mobile"],
    fullVersionList,
    model: profile.ua.model,
    platformVersion: profile.ua.platformVersion,
    uaFullVersion: fullVersion,
    wow64: false,
  };
}

/** Report the phone's client hints from `navigator.userAgentData` */
export function installUserAgentData(read) {
  const proto = globalThis.NavigatorUAData?.prototype;

  if (!proto) return;

  const brands = () => getBrands(read().userAgent);
  const lowEntropy = () => ({
    brands: brands(),
    mobile: read().profile.ua.mobile,
    platform: read().profile.ua.platform,
  });

  defineNativeGetter(proto, "brands", brands);
  defineNativeGetter(proto, "mobile", () => read().profile.ua.mobile);
  defineNativeGetter(proto, "platform", () => read().profile.ua.platform);

  wrapNativeMethod(proto, "toJSON", () => lowEntropy);
  wrapNativeMethod(proto, "getHighEntropyValues", () => async (hints) => {
    const values = getHighEntropyValues(read());
    const requested = Object.fromEntries(
      [...hints]
        .filter((hint) => hint in values)
        .map((hint) => [hint, values[hint]]),
    );

    return { ...lowEntropy(), ...requested };
  });
}
