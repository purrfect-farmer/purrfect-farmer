import { Faker, base, en, fakerEN as faker } from "@faker-js/faker";

export const generateFirstName = () => faker.person.firstName();

export const generateLastName = () => faker.person.lastName();

/** Faker username sanitized to start with a letter and fit within maxLength */
function buildUsername(instance, firstName, lastName, maxLength) {
  let username = instance.internet
    .username({ firstName, lastName })
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[^a-zA-Z]+/, "")
    .replace(/_+$/, "");

  if (!username) username = instance.word.noun().replace(/[^a-zA-Z]/g, "");

  while (username.length < 5) {
    username += instance.number.int(9);
  }

  return username.slice(0, maxLength).replace(/_+$/, "");
}

/** Faker username sanitized to Telegram rules (5-32 chars, starts with a letter) */
export function generateUsername(
  firstName = generateFirstName(),
  lastName = generateLastName(),
) {
  return buildUsername(faker, firstName, lastName, 32);
}

/** Username that is always the same for a numeric seed, at most maxLength chars */
export function deriveUsername(seed, maxLength = 32) {
  const seeded = new Faker({ locale: [en, base] });
  seeded.seed(Number(seed));

  const firstName = seeded.person.firstName();
  const lastName = seeded.person.lastName();

  return buildUsername(seeded, firstName, lastName, maxLength);
}

export function generateProfile() {
  const firstName = generateFirstName();
  const lastName = generateLastName();

  return {
    firstName,
    lastName,
    username: generateUsername(firstName, lastName),
  };
}

/** Profile parts a text can be removed from */
export const PROFILE_FIELDS = Object.freeze({
  NAME: "name",
  BIO: "bio",
});

/** Longest text the profile cleaner accepts */
export const PROFILE_CLEAN_TEXT_MAX = 64;

/** Remove every case-insensitive match of text, tidying the spaces it leaves */
export function stripText(value, text) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "gi");
  const original = value || "";

  if (!pattern.test(original)) return original;

  return original
    .replace(pattern, "")
    .replace(/[^\S\n]{2,}/g, " ")
    .trim();
}

/** Strip text from the chosen profile fields, returning only the changed values */
export function stripProfileText(profile, text, fields) {
  const changes = {};

  if (fields.includes(PROFILE_FIELDS.NAME)) {
    const oldFirstName = profile.firstName || "";
    const oldLastName = profile.lastName || "";
    let firstName = stripText(oldFirstName, text);
    let lastName = stripText(oldLastName, text);

    if (firstName !== oldFirstName || lastName !== oldLastName) {
      /** Telegram requires a first name */
      if (!firstName) {
        if (!lastName) throw new Error("Name would be empty");
        firstName = lastName;
        lastName = "";
      }

      changes.firstName = firstName;
      changes.lastName = lastName;
    }
  }

  if (fields.includes(PROFILE_FIELDS.BIO)) {
    const oldAbout = profile.about || "";
    const about = stripText(oldAbout, text);

    if (about !== oldAbout) {
      changes.about = about;
    }
  }

  return { changes, changed: Object.keys(changes).length > 0 };
}
