import { findInvalidLines, isValidKey, parseEnv } from "../../lib/env/parse.js";

import { fieldsByKey, schema } from "./schema.js";
import { validateField } from "../../config/env-schema.js";

/** Unchanged fields made required by a switch among the changed keys */
const dependentFields = (changedKeys) =>
  schema.fields.filter(
    (field) =>
      field.requiredWhen &&
      changedKeys.has(field.requiredWhen) &&
      !changedKeys.has(field.key),
  );

/** Validate a changes map against the current env, returns errors keyed by env key */
export function validateChanges(changes, current = {}) {
  const errors = {};
  const values = { ...current, ...changes };

  for (const [key, value] of Object.entries(changes)) {
    const field = fieldsByKey.get(key);

    if (!isValidKey(key)) {
      errors[key] = ["Names may only use letters, numbers and underscores."];
    } else if (value === null) {
      if (field?.required) errors[key] = [`${field.label} cannot be removed.`];
    } else if (typeof value !== "string") {
      errors[key] = ["Invalid value."];
    } else if (field) {
      const error = validateField(field, value, values);
      if (error) errors[key] = [error];
    } else if (/[\r\n]/.test(value)) {
      errors[key] = ["Must be a single line."];
    }
  }

  for (const field of dependentFields(new Set(Object.keys(changes)))) {
    const error = validateField(field, values[field.key] ?? "", values);
    if (error) errors[field.key] = [error];
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
  const changedKeys = new Set(
    [...keys].filter((key) => current[key] !== next[key]),
  );
  const checkedFields = [
    ...[...changedKeys].map((key) => fieldsByKey.get(key)).filter(Boolean),
    ...dependentFields(changedKeys),
  ];

  for (const field of checkedFields) {
    const error = validateField(field, next[field.key] ?? "", next);
    if (error) problems.push(`${field.key}: ${error}`);
  }

  return problems;
}
