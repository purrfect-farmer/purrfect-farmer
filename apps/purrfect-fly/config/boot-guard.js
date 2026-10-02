import envStore from "../lib/env-store.js";

/** Roll back an env that keeps failing to boot, before it is loaded */
const restored = envStore.runBootGuard();

if (restored) {
  console.warn(`Env failed to boot repeatedly, restored backup ${restored}`);
}
