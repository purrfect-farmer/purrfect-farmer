import {
  GENERATED_ENV_KEYS,
  ensureGeneratedKeys,
} from "../../lib/env/generated-keys.js";

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import { parseEnv } from "../../lib/env/parse.js";
import path from "node:path";
import { test } from "node:test";

/** A temp .env holding the given content */
function createEnvFile(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fly-keys-"));
  const envPath = path.join(dir, ".env");

  fs.writeFileSync(envPath, content, "utf-8");

  return envPath;
}

/** Run with the generated keys cleared from the process env */
function withoutProcessKeys(run) {
  const saved = GENERATED_ENV_KEYS.map((key) => [key, process.env[key]]);

  GENERATED_ENV_KEYS.forEach((key) => delete process.env[key]);

  try {
    return run();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("empty keys are filled and comments and order survive", () => {
  withoutProcessKeys(() => {
    const envPath = createEnvFile(
      '# Header\nAPP_NAME="Fly"\nJWT_SECRET_KEY=""\nENCRYPTION_KEY=""\nPORT=3000\n',
    );

    assert.deepEqual(ensureGeneratedKeys(envPath), GENERATED_ENV_KEYS);

    const content = fs.readFileSync(envPath, "utf-8");
    const values = parseEnv(content);

    assert.match(values.JWT_SECRET_KEY, /^[0-9a-f]{64}$/);
    assert.match(values.ENCRYPTION_KEY, /^[0-9a-f]{64}$/);
    assert.notEqual(values.JWT_SECRET_KEY, values.ENCRYPTION_KEY);
    assert.ok(content.startsWith('# Header\nAPP_NAME="Fly"\nJWT_SECRET_KEY='));
    assert.ok(content.trimEnd().endsWith("PORT=3000"));
  });
});

test("keys that are already set are left alone", () => {
  withoutProcessKeys(() => {
    const original = `JWT_SECRET_KEY="${"a".repeat(64)}"\nENCRYPTION_KEY="${"b".repeat(64)}"\n`;
    const envPath = createEnvFile(original);

    assert.deepEqual(ensureGeneratedKeys(envPath), []);
    assert.equal(fs.readFileSync(envPath, "utf-8"), original);
  });
});

test("a missing key is appended", () => {
  withoutProcessKeys(() => {
    const envPath = createEnvFile(`JWT_SECRET_KEY="${"a".repeat(64)}"\n`);

    assert.deepEqual(ensureGeneratedKeys(envPath), ["ENCRYPTION_KEY"]);
    assert.match(
      parseEnv(fs.readFileSync(envPath, "utf-8")).ENCRYPTION_KEY,
      /^[0-9a-f]{64}$/,
    );
  });
});

test("a key set in the process env is not written", () => {
  withoutProcessKeys(() => {
    process.env.ENCRYPTION_KEY = "c".repeat(64);

    const envPath = createEnvFile(`JWT_SECRET_KEY="${"a".repeat(64)}"\n`);

    assert.deepEqual(ensureGeneratedKeys(envPath), []);
  });
});

test("nothing is written without an env file", () => {
  withoutProcessKeys(() => {
    const envPath = path.join(os.tmpdir(), `fly-keys-missing-${Date.now()}`);

    assert.deepEqual(ensureGeneratedKeys(envPath), []);
    assert.equal(fs.existsSync(envPath), false);
  });
});
