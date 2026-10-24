import { defineNativeGetter } from "./native";

/** Report the phone's screen, pixel ratio and orientation */
export function installScreen(read) {
  const proto = Screen.prototype;
  const screen = () => read().profile.screen;

  defineNativeGetter(proto, "width", () => screen().w);
  defineNativeGetter(proto, "height", () => screen().h);
  defineNativeGetter(proto, "availWidth", () => screen().aw);
  defineNativeGetter(proto, "availHeight", () => screen().ah);
  defineNativeGetter(proto, "colorDepth", () => screen().depth);
  defineNativeGetter(proto, "pixelDepth", () => screen().depth);
  defineNativeGetter(window, "devicePixelRatio", () => read().devicePixelRatio);

  const orientation = globalThis.ScreenOrientation?.prototype;

  defineNativeGetter(orientation, "type", () => read().profile.orientation);
  defineNativeGetter(orientation, "angle", () => 0);
}
