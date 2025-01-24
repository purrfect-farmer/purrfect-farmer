import { core } from "./content-script-utils";

if (location.hash.includes("tgWebAppData")) {
  switch (location.host) {
    /** Bypass KittyVerse on Desktop */
    case "play.kittyverse.ai":
      /** Override Match Media */
      window.matchMedia = (...args) => {
        const result = core.matchMedia(...args);

        if (result.media === "(pointer: coarse)") {
          return new Proxy(result, {
            get(target, p) {
              if (p === "matches") {
                return true;
              } else {
                return target[p];
              }
            },
          });
        } else {
          return result;
        }
      };

      /** Remove Haptic */
      localStorage.removeItem("haptic");

      break;
  }
}
