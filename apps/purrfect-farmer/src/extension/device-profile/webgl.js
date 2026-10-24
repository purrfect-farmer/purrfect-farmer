import { wrapNativeMethod } from "./native";

/** `WEBGL_debug_renderer_info` parameters */
const UNMASKED_VENDOR_WEBGL = 0x9245;
const UNMASKED_RENDERER_WEBGL = 0x9246;

/** WebGL limit parameters */
const MAX_TEXTURE_SIZE = 0x0d33;
const MAX_RENDERBUFFER_SIZE = 0x84e8;
const MAX_VERTEX_ATTRIBS = 0x8869;
const MAX_VARYING_VECTORS = 0x8dfc;

/** The limits `profile.webglParams` lists, in its order */
const LIMIT_PARAMETERS = [
  MAX_TEXTURE_SIZE,
  MAX_RENDERBUFFER_SIZE,
  MAX_VERTEX_ATTRIBS,
  MAX_VARYING_VECTORS,
];

/** The phone's GPU answer for a parameter, or undefined to ask the real one */
function getPhoneParameter(profile, parameter) {
  const [vendor, renderer] = profile.webgl.split(" / ");

  if (parameter === UNMASKED_VENDOR_WEBGL) return vendor;
  if (parameter === UNMASKED_RENDERER_WEBGL) return renderer;

  const index = LIMIT_PARAMETERS.indexOf(parameter);

  if (index === -1) return undefined;

  return Number(profile.webglParams.split(",")[index]);
}

/** Report the phone's GPU and its limits from WebGL */
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
          const value = getPhoneParameter(read().profile, parameter);

          return value === undefined
            ? getParameter.call(this, parameter)
            : value;
        },
    );
  }
}
