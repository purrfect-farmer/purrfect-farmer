/** Typed value of an env string */
export function parseEnvValue(value) {
  value = value.trim();

  switch (value.toLowerCase()) {
    case "true":
    case "(true)":
      return true;
    case "false":
    case "(false)":
      return false;
    case "null":
    case "(null)":
      return null;
    case "empty":
    case "(empty)":
      return "";
  }

  if (!isNaN(value) && value !== "") {
    return Number(value);
  }

  return value;
}

/** Typed env value, or the default when the key is not set */
export function readEnvValue(key, defaultValue) {
  const value = process.env[key];

  if (value === undefined) return defaultValue;

  return parseEnvValue(value);
}
