import { maskSecret } from "../../lib/env/patch.js";
import { parseEnv } from "../../lib/env/parse.js";

import envStore from "../../lib/env-store.js";
import serverCipher from "../../lib/ServerCipher.js";
import { schema } from "./schema.js";
import { isFieldRequired, validateField } from "../../config/env-schema.js";

/** Settings form data: values, masked secrets and current issues */
export async function getSettingsForm() {
  const current = parseEnv(await envStore.readEnv());
  const values = {};
  const secrets = {};
  const issues = {};

  for (const field of schema.fields) {
    const value = current[field.key];

    if (field.type === "secret") {
      secrets[field.key] = {
        isSet: Boolean(value),
        preview: maskSecret(value),
      };
    } else if (value !== undefined) {
      values[field.key] = value;
    }

    if (value !== undefined || isFieldRequired(field, current)) {
      const error = validateField(field, value ?? "", current);
      if (error) issues[field.key] = error;
    }
  }

  return {
    groups: schema.groups,
    fields: schema.fields,
    values,
    secrets,
    issues,
    encryption: { active: serverCipher.isAvailable() },
  };
}
