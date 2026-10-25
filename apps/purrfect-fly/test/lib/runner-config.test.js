import assert from "node:assert/strict";
import { test } from "node:test";
import { readEnvValue } from "../../lib/env/value.js";

/** The runner config reads env through the global helper */
global.env = readEnvValue;

const { resolveRunnerConfig } = await import("../../farmers/runner/config.js");

const FarmerClass = { id: "example", autoStart: false };

/** Resolve the config with only the given env keys set */
const resolveWith = (vars) => {
  const keys = ["DEFAULT_AUTO_START", "FARMER_EXAMPLE_AUTO_START"];
  const saved = keys.map((key) => [key, process.env[key]]);

  keys.forEach((key) => delete process.env[key]);
  Object.assign(process.env, vars);

  try {
    return resolveRunnerConfig(FarmerClass);
  } finally {
    saved.forEach(([key, value]) =>
      value === undefined
        ? delete process.env[key]
        : (process.env[key] = value),
    );
  }
};

test("auto-start falls back to the farmer class", () => {
  assert.equal(resolveWith({}).autoStart, false);
});

test("auto-start uses the default when the farmer has no override", () => {
  assert.equal(resolveWith({ DEFAULT_AUTO_START: "true" }).autoStart, true);
});

test("the farmer override wins over the default", () => {
  const config = resolveWith({
    DEFAULT_AUTO_START: "true",
    FARMER_EXAMPLE_AUTO_START: "false",
  });

  assert.equal(config.autoStart, false);
});
