import assert from "node:assert/strict";
import test from "node:test";

import {
  getTimeZoneOffset,
  normalizeLocale,
  normalizeTimeZone,
} from "@purrfect/shared/lib/device/locale.js";
import { createDevice } from "@purrfect/shared/lib/device/createDevice.js";
import { getSyncedAccountFields } from "../../services/synced-account-fields.js";

test("time zones and locales normalize, or are rejected", () => {
  assert.equal(normalizeTimeZone("africa/lagos"), "Africa/Lagos");
  assert.equal(normalizeTimeZone("Mars/Base"), null);
  assert.equal(normalizeTimeZone(42), null);
  assert.equal(normalizeLocale("en-gb"), "en-GB");
  assert.equal(normalizeLocale("not a locale"), null);
  assert.equal(normalizeLocale("x".repeat(100)), null);
});

test("the offset follows the time zone, signed like getTimezoneOffset", () => {
  const winter = new Date("2026-01-15T12:00:00Z");
  const summer = new Date("2026-07-15T12:00:00Z");

  assert.equal(getTimeZoneOffset("UTC", winter), 0);
  assert.equal(getTimeZoneOffset("Africa/Lagos", winter), -60);
  assert.equal(getTimeZoneOffset("America/New_York", winter), 300);
  assert.equal(getTimeZoneOffset("America/New_York", summer), 240);
  assert.equal(getTimeZoneOffset("Asia/Kolkata", winter), -330);
});

test("the device reports the account's time zone and locale", () => {
  const { profile } = createDevice(42, "", {
    timeZone: "Africa/Lagos",
    locale: "fr-FR",
  });

  assert.equal(profile.tz, "Africa/Lagos");
  assert.equal(profile.locale, "fr-FR");
  assert.equal(profile.langs, "fr-FR,fr,en-US,en");
});

test("a sync keeps only a valid User-Agent, time zone and locale", () => {
  const user = { id: 1 };
  const valid = getSyncedAccountFields(
    {
      title: "Example",
      userAgent: "Mozilla/5.0 (Linux; Android 15; K) Chrome/155.0.0.0 Mobile",
      timeZone: "europe/london",
      locale: "en-gb",
    },
    user,
  );
  const invalid = getSyncedAccountFields(
    { title: "Example", userAgent: "curl", timeZone: "Mars", locale: "!!" },
    user,
  );

  assert.equal(valid.timeZone, "Europe/London");
  assert.equal(valid.locale, "en-GB");
  assert.ok(valid.userAgent);
  assert.deepEqual(invalid, { title: "Example", user });
});
