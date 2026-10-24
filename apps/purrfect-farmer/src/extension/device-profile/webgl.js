import { wrapNativeMethod } from "./native";

/** `WEBGL_debug_renderer_info` parameters */
const UNMASKED_VENDOR_WEBGL = 0x9245;
const UNMASKED_RENDERER_WEBGL = 0x9246;

/** Report the phone's GPU from WebGL */
export function installWebGL(read) {
  const contexts = [
    globalThis.WebGLRenderingContext,
    globalThis.WebGL2RenderingContext,
  ];

  for (const context of contexts) {
    wrapNativeMethod(
      context?.prototype,
      "getParameter",
      (getParameter) =>
        function (parameter) {
          const [vendor, renderer] = read().profile.webgl.split(" / ");

          if (parameter === UNMASKED_VENDOR_WEBGL) return vendor;
          if (parameter === UNMASKED_RENDERER_WEBGL) return renderer;

          return getParameter.call(this, parameter);
        },
    );
  }
}
