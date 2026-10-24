/** The time zone and locale used when none is known */
const FALLBACK_LOCALE = Object.freeze({ timeZone: "UTC", locale: "en-US" });

/** Longest time zone or locale an account can store */
export const MAX_LOCALE_FIELD_LENGTH = 64;

/** The canonical name of an IANA time zone, or null when it is not one */
export function normalizeTimeZone(value) {
  if (typeof value !== "string" || value.length > MAX_LOCALE_FIELD_LENGTH) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: value,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** The canonical BCP 47 tag of a locale, or null when it is not one */
export function normalizeLocale(value) {
  if (typeof value !== "string" || value.length > MAX_LOCALE_FIELD_LENGTH) {
    return null;
  }

  try {
    return Intl.getCanonicalLocales(value)[0] || null;
  } catch {
    return null;
  }
}

/** The host's time zone and locale */
export function readHostLocale() {
  try {
    const { timeZone, locale } = Intl.DateTimeFormat().resolvedOptions();

    return {
      timeZone: normalizeTimeZone(timeZone) || FALLBACK_LOCALE.timeZone,
      locale: normalizeLocale(locale) || FALLBACK_LOCALE.locale,
    };
  } catch {
    return { ...FALLBACK_LOCALE };
  }
}

/** A stored time zone and locale, with the host's filling whatever is missing or invalid */
export function resolveDeviceLocale({ timeZone, locale } = {}) {
  const host = readHostLocale();

  return {
    timeZone: normalizeTimeZone(timeZone) || host.timeZone,
    locale: normalizeLocale(locale) || host.locale,
  };
}

/** Minutes a time zone is behind UTC at `date`, signed like `Date#getTimezoneOffset` */
export function getTimeZoneOffset(timeZone, date = new Date()) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/);

  if (!match) return 0;

  const [, sign, hours, minutes] = match;
  const offset = Number(hours) * 60 + Number(minutes);

  if (offset === 0) return 0;

  return sign === "+" ? -offset : offset;
}
