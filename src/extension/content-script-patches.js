import { withValue } from "@/lib/utils";

import { watchTelegramMiniApp } from "./content-script-utils";

watchTelegramMiniApp().then(() => {
  switch (location.host) {
    /** Bypass KittyVerse on Desktop */
    case "play.kittyverse.ai":
      /** Override Match Media */
      window.matchMedia = withValue(
        window.matchMedia.bind(window),
        (matchMedia) =>
          (...args) => {
            const result = matchMedia(...args);

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
          }
      );

      /** Override Element */
      HTMLDivElement.prototype.__addEventListener =
        HTMLDivElement.prototype.addEventListener;

      HTMLDivElement.prototype.addEventListener = function (...args) {
        if (args[0] === "touchstart") {
          return this.__addEventListener.apply(this, [
            "mousedown",
            ...args.slice(1),
          ]);
        }
        return this.__addEventListener.apply(this, args);
      };

      /** Remove Haptic */
      localStorage.removeItem("haptic");

      break;
  }
});
