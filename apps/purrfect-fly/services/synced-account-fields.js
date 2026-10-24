import isValidUserAgent from "@purrfect/shared/lib/userAgent/isValidUserAgent.js";
import {
  normalizeLocale,
  normalizeTimeZone,
} from "@purrfect/shared/lib/device/locale.js";

/** The account fields a farmer sync sets, keeping only a valid User-Agent, time zone and locale */
export function getSyncedAccountFields(body, user) {
  const fields = { title: body.title, user };
  const timeZone = normalizeTimeZone(body.timeZone);
  const locale = normalizeLocale(body.locale);

  if (isValidUserAgent(body.userAgent)) {
    fields.userAgent = body.userAgent;
  }

  if (timeZone) fields.timeZone = timeZone;
  if (locale) fields.locale = locale;

  return fields;
}
