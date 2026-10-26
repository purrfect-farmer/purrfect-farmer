import assert from "node:assert/strict";
import { test } from "node:test";
import { readEnvValue } from "../../lib/env/value.js";

/** The runner config reads env through the global helper */
global.env = readEnvValue;

const { resolveRunnerConfig } = await import("../../farmers/runner/config.js");

const FarmerClass = { id: "example", autoStart: false };

/** Resolve the config with only the given env keys set */
const resolveWith = (vars) => {
  const keys = [
    "DEFAULT_AUTO_START",
    "FARMER_EXAMPLE_AUTO_START",
    "TASK_RETRY_COUNT",
    "FARMER_EXAMPLE_TASK_RETRY_COUNT",
    "FARMER_RETRY_COUNT",
    "FARMER_EXAMPLE_FARMER_RETRY_COUNT",
  ];
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

test("retries default to one", () => {
  const config = resolveWith({});

  assert.equal(config.taskRetries, 1);
  assert.equal(config.farmerRetries, 1);
});

test("the farmer's retries override the default retries", () => {
  const config = resolveWith({
    TASK_RETRY_COUNT: "2",
    FARMER_RETRY_COUNT: "1",
    FARMER_EXAMPLE_TASK_RETRY_COUNT: "3",
  });

  assert.equal(config.taskRetries, 3);
  assert.equal(config.farmerRetries, 1);
});
