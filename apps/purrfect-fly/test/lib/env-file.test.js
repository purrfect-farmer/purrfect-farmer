import {
  applyChanges,
  createEnvStore,
  diffLines,
  findInvalidLines,
  formatValue,
  maskLine,
  parseEnv,
} from "../../lib/env-file.js";

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const SAMPLE = `# Header comment
APP_NAME="Purrfect Fly"
JWT_SECRET_KEY=""

# Captcha
CAPTCHA_PROVIDER="2captcha" # Options: "2captcha", "captchaai"
CAPTCHA_API_KEY=""
PROXY_PAGE=1
`;

test("only changed lines are rewritten and comments survive", () => {
  const output = applyChanges(SAMPLE, {
    CAPTCHA_PROVIDER: "captchaai",
    PROXY_PAGE: "2",
  });

  assert.equal(
    output,
    SAMPLE.replace('"2captcha" #', '"captchaai" #').replace(
      "PROXY_PAGE=1",
      "PROXY_PAGE=2",
    ),
  );
  assert.equal(parseEnv(output).CAPTCHA_PROVIDER, "captchaai");
});

test("null removes a key", () => {
  const output = applyChanges(SAMPLE, { PROXY_PAGE: null });

  assert.equal(parseEnv(output).PROXY_PAGE, undefined);
  assert.ok(output.includes("# Captcha"));
});

test("new keys join their section or start a new one", () => {
  const sectionOf = (key) => key.split("_")[0];
  const output = applyChanges(
    SAMPLE,
    { CAPTCHA_TIMEOUT: "5", SEEKER_KEY: "abc" },
    sectionOf,
    (section) => `${section} settings`,
  );
  const lines = output.split("\n");

  assert.equal(
    lines[lines.indexOf('CAPTCHA_API_KEY=""') + 1],
    "CAPTCHA_TIMEOUT=5",
  );
  assert.ok(output.endsWith('\n# SEEKER settings\nSEEKER_KEY="abc"\n'));
});

test("multi-line quoted values are replaced whole", () => {
  const content = 'A="one\ntwo"\nB=1\n';
  const output = applyChanges(content, { A: "x" });

  assert.equal(output, 'A="x"\nB=1\n');
});

test("values round-trip through dotenv", () => {
  for (const value of ["", "plain", 'has "quotes"', "back\\slash", "a#b", " padded "]) {
    const output = applyChanges("KEY=old\n", { KEY: value });
    assert.equal(parseEnv(output).KEY, value, `round-trip ${value}`);
  }

  assert.equal(formatValue("true"), "true");
  assert.equal(formatValue("-1001"), "-1001");
});

test("garbage lines are reported", () => {
  assert.deepEqual(findInvalidLines(SAMPLE), []);
  assert.deepEqual(findInvalidLines("A=1\noops\n# fine\n\nB=2\n"), [2]);
});

test("diff marks added and removed lines", () => {
  const diff = diffLines("A=1\nB=2\n", "A=1\nB=3\n");

  assert.deepEqual(diff, [
    { type: "same", line: "A=1" },
    { type: "removed", line: "B=2" },
    { type: "added", line: "B=3" },
  ]);
});

test("secret lines are masked", () => {
  const keys = new Set(["TOKEN"]);

  assert.equal(maskLine('TOKEN="1234567890abc"', keys), "TOKEN=123•••abc");
  assert.equal(maskLine("OTHER=1", keys), "OTHER=1");
});

test("boot guard restores the backup after repeated failed boots", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "env-store-"));
  const store = createEnvStore(dir);

  fs.writeFileSync(path.join(dir, ".env"), "GOOD=1\n");
  await store.writeEnv("BAD=1\n");

  assert.equal(store.runBootGuard(), null);
  assert.equal(store.runBootGuard(), null);
  assert.ok(store.runBootGuard());
  assert.equal(fs.readFileSync(path.join(dir, ".env"), "utf-8"), "GOOD=1\n");

  const restored = await store.confirmBoot();
  assert.ok(restored.backup);
  assert.equal(await store.confirmBoot(), null);

  fs.rmSync(dir, { recursive: true, force: true });
});

test("a successful boot clears the guard", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "env-store-"));
  const store = createEnvStore(dir);

  fs.writeFileSync(path.join(dir, ".env"), "GOOD=1\n");
  await store.writeEnv("NEW=1\n");

  store.runBootGuard();
  await store.confirmBoot();

  assert.equal(store.runBootGuard(), null);
  assert.equal(fs.readFileSync(path.join(dir, ".env"), "utf-8"), "NEW=1\n");
  assert.equal((await store.listBackups()).length, 1);
  await assert.rejects(store.readBackup("../.env"));

  fs.rmSync(dir, { recursive: true, force: true });
});
