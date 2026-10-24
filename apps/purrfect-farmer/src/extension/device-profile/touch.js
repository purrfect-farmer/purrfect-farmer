import { wrapNativeMethod } from "./native";

/** What a touch-only phone answers for each pointer and hover feature */
const TOUCH_FEATURES = {
  pointer: { coarse: true, fine: false, none: false },
  hover: { none: true, hover: false },
};

/** Media queries that always or never match */
const ALWAYS = "(min-width: 0px)";
const NEVER = "(max-width: -1px)";

/** Matches `(pointer: coarse)`, `(any-hover)` and the like */
const FEATURE_PATTERN =
  /\(\s*(?:any-)?(pointer|hover)\s*(?::\s*([a-z]+)\s*)?\)/gi;

/** Rewrite a media query's pointer and hover features as a phone answers them */
function rewriteQuery(query) {
  return String(query).replace(FEATURE_PATTERN, (match, feature, value) => {
    const answers = TOUCH_FEATURES[feature.toLowerCase()];
    const matches = value
      ? answers[value.toLowerCase()]
      : feature.toLowerCase() === "pointer";

    return matches ? ALWAYS : NEVER;
  });
}

/** Answer touch checks the way a phone does */
export function installTouch() {
  if (!("ontouchstart" in window)) {
    Object.defineProperty(window, "ontouchstart", {
      value: null,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  wrapNativeMethod(
    window,
    "matchMedia",
    (matchMedia) =>
      function (query) {
        const list = matchMedia.call(this, rewriteQuery(query));

        Object.defineProperty(list, "media", { value: String(query) });

        return list;
      },
  );
}
