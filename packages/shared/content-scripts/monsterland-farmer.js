if (location.host === "lets.playmonsterland.com") {
  /** disable-devtool closes the app once devtools open, its factory is recognized by these */
  const isDisableDevtool = (factory) => {
    if (typeof factory !== "function") return false;

    const source = Function.prototype.toString.call(factory);

    return (
      source.includes("isDevToolOpened") && source.includes("ondevtoolopen")
    );
  };

  /** An inert disable-devtool: it never starts, so no detector or exit runs */
  const stubFactory = (_require, module) => {
    module.exports = Object.assign(
      () => ({ success: false, reason: "disabled" }),
      {
        isRunning: false,
        isSuspend: false,
        version: "0.0.0",
        md5: () => "",
        isDevToolOpened: () => false,
      },
    );
  };

  /** A chunk is `[script, ...moduleIds, factory, ...]`, so swap the factory in place */
  const patchChunk = (chunk) => {
    if (!Array.isArray(chunk)) return chunk;

    return chunk.map((entry) => {
      if (isDisableDevtool(entry)) {
        console.info("[Purrfect] Neutralized disable-devtool.");
        return stubFactory;
      }

      return entry;
    });
  };

  /** Patch every chunk pushed into the registry, whether it is still the queue array or the runtime's object */
  const wrapRegistry = (registry) => {
    if (!registry || typeof registry.push !== "function") return registry;
    if (registry.__purrfectPatched) return registry;

    const push = registry.push;

    registry.push = function (...chunks) {
      return push.apply(this, chunks.map(patchChunk));
    };

    Object.defineProperty(registry, "__purrfectPatched", { value: true });

    return registry;
  };

  let registry = wrapRegistry(globalThis.TURBOPACK);

  Object.defineProperty(globalThis, "TURBOPACK", {
    configurable: true,
    get() {
      return registry;
    },
    set(value) {
      registry = wrapRegistry(value);
    },
  });
}
