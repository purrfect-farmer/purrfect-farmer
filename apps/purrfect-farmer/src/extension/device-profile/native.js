/** Names that marked functions print under as native code */
const nativeNames = new WeakMap();

/** Whether `Function.prototype.toString` prints marked functions yet */
let isToStringPatched = false;

/** Mark a function to print as native code under `name` */
function markNative(fn, name) {
  if (!isToStringPatched) {
    isToStringPatched = true;
    patchToString();
  }

  nativeNames.set(fn, name);

  return fn;
}

/** Make `Function.prototype.toString` print marked functions as native */
function patchToString() {
  const toString = Function.prototype.toString;

  const { toString: patchedToString } = {
    toString() {
      const name = nativeNames.get(this);

      if (typeof name === "string") {
        return `function ${name}() { [native code] }`;
      }

      return toString.call(this);
    },
  };

  Object.defineProperty(Function.prototype, "toString", {
    value: markNative(patchedToString, "toString"),
    configurable: true,
    writable: true,
  });
}

/** Define a getter shaped like a native one (named `get key`, no prototype) */
export function defineNativeGetter(target, key, getValue) {
  if (!target) return;

  const { get } = Object.getOwnPropertyDescriptor(
    {
      get [key]() {
        return getValue();
      },
    },
    key,
  );

  Object.defineProperty(target, key, {
    get: markNative(get, `get ${key}`),
    configurable: true,
    enumerable: true,
  });
}

/** Replace a method with a wrapper shaped like the native one it wraps */
export function wrapNativeMethod(target, key, createWrapper) {
  const original = target?.[key];

  if (typeof original !== "function") return;

  const wrapper = createWrapper(original);
  const { [key]: method } = {
    [key](...args) {
      return wrapper.apply(this, args);
    },
  };

  Object.defineProperty(method, "length", { value: original.length });
  Object.defineProperty(target, key, {
    value: markNative(method, key),
    configurable: true,
    enumerable: true,
    writable: true,
  });
}
