import { findInvalidLines, isValidKey, parseEnv } from "../../lib/env-file.js";

import { fieldsByKey } from "./schema.js";
import { validateField } from "../../config/env-schema.js";

/** Validate a changes map, returns errors keyed by env key */
export function validateChanges(changes) {
  const errors = {};

  for (const [key, value] of Object.entries(changes)) {
    const field = fieldsByKey.get(key);

    if (!isValidKey(key)) {
      errors[key] = ["Names may only use letters, numbers and underscores."];
    } else if (value === null) {
      if (field?.required) errors[key] = [`${field.label} cannot be removed.`];
    } else if (typeof value !== "string") {
      errors[key] = ["Invalid value."];
    } else if (field) {
      const error = validateField(field, value);
      if (error) errors[key] = [error];
    } else if (/[\r\n]/.test(value)) {
      errors[key] = ["Must be a single line."];
    }
  }

  return errors;
}

/** Validate raw content against the current env, returns a list of problems */
export function validateContent(content, current) {
  const problems = [];
  const invalidLines = findInvalidLines(content);

  if (invalidLines.length) {
    problems.push(
      `Line ${invalidLines.join(", ")} is not a comment or KEY=value.`,
    );
  }

  const next = parseEnv(content);
  const keys = new Set([...Object.keys(current), ...Object.keys(next)]);

  for (const key of keys) {
    const field = fieldsByKey.get(key);
    if (!field || current[key] === next[key]) continue;

    const error = validateField(field, next[key] ?? "");
    if (error) problems.push(`${key}: ${error}`);
  }

  return problems;
}
