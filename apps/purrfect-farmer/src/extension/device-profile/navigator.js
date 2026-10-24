import { defineNativeGetter } from "./native";

/** Browsers report `deviceMemory` capped at 8 */
const MAX_DEVICE_MEMORY = 8;

/** A plugin list that is empty, like an Android WebView's */
function createEmptyList(list) {
  return new Proxy(list, {
    get(target, key) {
      if (key === "length") return 0;
      if (key === "item" || key === "namedItem") return () => null;
      if (key === "refresh") return () => {};
      if (key === Symbol.iterator) return [][Symbol.iterator].bind([]);
      if (typeof key === "string" && /^\d+$/.test(key)) return undefined;

      return Reflect.get(target, key, target);
    },
    has(target, key) {
      return typeof key === "string" && /^\d+$/.test(key)
        ? false
        : Reflect.has(target, key);
    },
    ownKeys() {
      return [];
    },
  });
}

/** The phone's languages, the same frozen list until the device changes */
function createLanguages(read) {
  let langs = null;
  let list = null;

  return () => {
    if (read().profile.langs !== langs) {
      langs = read().profile.langs;
      list = Object.freeze(langs.split(","));
    }

    return list;
  };
}

/** Report the phone's navigator values */
export function installNavigator(read) {
  const proto = Navigator.prototype;
  const plugins = createEmptyList(navigator.plugins);
  const mimeTypes = createEmptyList(navigator.mimeTypes);
  const languages = createLanguages(read);

  defineNativeGetter(proto, "userAgent", () => read().userAgent);
  defineNativeGetter(proto, "appVersion", () =>
    read().userAgent.replace(/^Mozilla\//, ""),
  );
  defineNativeGetter(proto, "platform", () => read().profile.platform);
  defineNativeGetter(proto, "vendor", () => read().profile.vendor);
  defineNativeGetter(proto, "hardwareConcurrency", () => read().profile.cpu);
  defineNativeGetter(proto, "deviceMemory", () =>
    Math.min(MAX_DEVICE_MEMORY, read().profile.ram),
  );
  defineNativeGetter(proto, "maxTouchPoints", () => read().profile.touch);
  defineNativeGetter(proto, "languages", languages);
  defineNativeGetter(proto, "language", () => languages()[0]);
  defineNativeGetter(proto, "webdriver", () => false);
  defineNativeGetter(proto, "pdfViewerEnabled", () => read().profile.pdf);
  defineNativeGetter(proto, "plugins", () => plugins);
  defineNativeGetter(proto, "mimeTypes", () => mimeTypes);
}

/** Report the phone's network connection */
export function installConnection(read) {
  const proto = globalThis.NetworkInformation?.prototype;
  const net = () => read().profile.net;

  defineNativeGetter(proto, "type", () => net().type);
  defineNativeGetter(proto, "effectiveType", () => net().eff);
  defineNativeGetter(proto, "rtt", () => net().rtt);
  defineNativeGetter(proto, "downlink", () => net().down);
  defineNativeGetter(proto, "saveData", () => net().save);
}
