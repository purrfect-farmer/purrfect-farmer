import { applyChanges } from "../../lib/env/edit.js";
import { parseEnv } from "../../lib/env/parse.js";
import { sectionOf, sectionTitle, toText } from "./schema.js";
import { validateChanges, validateContent } from "./validate.js";

import envStore from "../../lib/env-store.js";
import { findLockedChanges } from "./locks.js";

/** The target, refused when it changes a key that stored data depends on */
async function withLocks(target) {
  if (target.errors) return target;

  const errors = await findLockedChanges(target.before, target.after);

  return Object.keys(errors).length
    ? { before: target.before, errors }
    : target;
}

/** Work out the new content from changes, raw content or a backup */
export async function resolveTarget(body) {
  return withLocks(await resolveUnlockedTarget(body));
}

/** Work out the new content without checking locked keys */
async function resolveUnlockedTarget(body) {
  const before = await envStore.readEnv();
  const current = parseEnv(before);

  if (body.changes) {
    const changes = Object.fromEntries(
      Object.entries(body.changes).map(([key, value]) => [key, toText(value)]),
    );
    const errors = validateChanges(changes);

    if (Object.keys(errors).length) return { before, errors };

    return {
      before,
      after: applyChanges(before, changes, sectionOf, sectionTitle),
    };
  }

  const field = typeof body.backup === "string" ? "backup" : "content";
  const after =
    field === "backup"
      ? await envStore.readBackup(body.backup).catch(() => null)
      : body.content;

  if (typeof after !== "string") {
    return {
      before,
      errors: {
        [field]: [
          field === "backup" ? "Backup not found." : "Nothing to save.",
        ],
      },
    };
  }

  const problems = validateContent(after, current);

  return problems.length
    ? { before, errors: { [field]: [problems.join("\n")] } }
    : { before, after };
}

/** Keys whose value differs between two contents */
export function getChangedKeys(before, after) {
  const a = parseEnv(before);
  const b = parseEnv(after);

  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (key) => a[key] !== b[key],
  );
}

/** Values to test with: current env overlaid with unsaved form values */
export async function getTestValues(values = {}) {
  const current = parseEnv(await envStore.readEnv());

  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined) current[key] = toText(value);
  }

  return current;
}
