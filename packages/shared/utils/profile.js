import { fakerEN as faker } from "@faker-js/faker";

export const generateFirstName = () => faker.person.firstName();

export const generateLastName = () => faker.person.lastName();

/** Faker username sanitized to Telegram rules (5-32 chars, starts with a letter) */
export function generateUsername(
  firstName = generateFirstName(),
  lastName = generateLastName(),
) {
  let username = faker.internet
    .username({ firstName, lastName })
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[^a-zA-Z]+/, "")
    .replace(/_+$/, "");

  if (!username) username = faker.word.noun().replace(/[^a-zA-Z]/g, "");

  while (username.length < 5) {
    username += faker.number.int(9);
  }

  return username.slice(0, 32).replace(/_+$/, "");
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
