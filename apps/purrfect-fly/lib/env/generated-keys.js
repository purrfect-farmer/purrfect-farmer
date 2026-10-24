import { applyChanges } from "./edit.js";
import crypto from "node:crypto";
import fs from "node:fs";
import { parseEnv } from "./parse.js";

/** 32 random bytes as hex, the format every generated key uses */
export const generateSecretKey = () => crypto.randomBytes(32).toString("hex");

/** Keys the server makes itself when they are missing */
export const GENERATED_ENV_KEYS = Object.freeze([
  "JWT_SECRET_KEY",
  "ENCRYPTION_KEY",
]);

/** Keys this process wrote, so a command run after loading can still report them */
export const writtenKeys = new Set();

/** Write every missing generated key into the env file, returning the keys written */
export function ensureGeneratedKeys(envPath) {
  if (!fs.existsSync(envPath)) return [];

  const content = fs.readFileSync(envPath, "utf-8");
  const current = parseEnv(content);
  const missing = GENERATED_ENV_KEYS.filter(
    (key) => !current[key]?.trim() && !process.env[key]?.trim(),
  );

  if (missing.length === 0) return [];

  const changes = Object.fromEntries(
    missing.map((key) => [key, generateSecretKey()]),
  );

  fs.writeFileSync(envPath, applyChanges(content, changes), "utf-8");
  missing.forEach((key) => writtenKeys.add(key));

  return missing;
}
