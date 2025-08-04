import { Buffer } from "buffer";

if (typeof window === "undefined") {
  globalThis.window = globalThis;
}

globalThis.Buffer = Buffer;
