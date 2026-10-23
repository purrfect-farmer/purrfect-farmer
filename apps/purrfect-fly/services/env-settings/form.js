import { maskSecret, parseEnv } from "../../lib/env-file.js";

import envStore from "../../lib/env-store.js";
import { schema } from "./schema.js";
import { validateField } from "../../config/env-schema.js";

/** Settings form data: values, masked secrets and current issues */
export async function getSettingsForm() {
  const current = parseEnv(await envStore.readEnv());
  const values = {};
  const secrets = {};
  const issues = {};

  for (const field of schema.fields) {
    const value = current[field.key];

    if (field.type === "secret") {
      secrets[field.key] = { isSet: Boolean(value), preview: maskSecret(value) };
    } else if (value !== undefined) {
      values[field.key] = value;
    }

    if (value !== undefined || field.required) {
      const error = validateField(field, value ?? "");
      if (error) issues[field.key] = error;
    }
  }

  return {
    groups: schema.groups,
    fields: schema.fields,
    values,
    secrets,
    issues,
  };
}
