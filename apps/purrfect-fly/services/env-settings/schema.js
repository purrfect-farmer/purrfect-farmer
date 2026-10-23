import farmers from "../../farmers/index.js";
import { getEnvSchema } from "../../config/env-schema.js";

/** Settings schema with the lookups the manager needs */
export const schema = getEnvSchema(farmers);

export const fieldsByKey = new Map(
  schema.fields.map((field) => [field.key, field]),
);

export const secretKeys = new Set(
  schema.fields
    .filter((field) => field.type === "secret")
    .map((field) => field.key),
);

const groupTitles = new Map(
  schema.groups.map((group) => [group.id, group.title]),
);

/** Section a key belongs to when it is added to the file */
export const sectionOf = (key) => fieldsByKey.get(key)?.group ?? "";

/** Heading written above a new section */
export const sectionTitle = (section) => groupTitles.get(section) ?? section;

/** Normalize a submitted value to text */
export const toText = (value) =>
  typeof value === "boolean" || typeof value === "number"
    ? String(value)
    : value;
