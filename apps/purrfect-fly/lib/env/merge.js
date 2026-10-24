import { applyChanges } from "./edit.js";
import { parseEnv } from "./parse.js";

/** The restored env with the given keys taken from the current env, or left out when unset there */
export function mergeInstanceEnv(restoredEnv, currentEnv, keys) {
  const current = parseEnv(currentEnv);
  const changes = Object.fromEntries(
    keys.map((key) => [key, current[key] ?? null]),
  );

  return applyChanges(restoredEnv, changes);
}
