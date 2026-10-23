import fsp from "node:fs/promises";
import { getCurrentPath } from "../path.js";
import { globby } from "globby";
import path from "node:path";

const { __dirname } = getCurrentPath(import.meta.url);

/** Directory holding every session file */
export function getStoragePath() {
  return path.resolve(__dirname, "../../sessions");
}

/** File path of a named session */
export function getSessionPath(name) {
  return path.join(getStoragePath(), `session_${name}.json`);
}

/** Names of every stored session */
export async function getSessions() {
  const entries = await globby([path.join(getStoragePath(), "*.json")]);

  return entries.map((item) => path.basename(item, ".json").split("_")[1]);
}

/** Whether a named session file exists */
export function sessionFileExists(name) {
  return fsp
    .access(getSessionPath(name))
    .then(() => true)
    .catch(() => false);
}

/** Read a session string, empty when the file does not exist */
export async function readSession(name) {
  if (!(await sessionFileExists(name))) return "";

  return JSON.parse(await fsp.readFile(getSessionPath(name)));
}

/** Write a session string */
export function writeSession(name, content) {
  return fsp.writeFile(getSessionPath(name), JSON.stringify(content));
}

/** Delete a session file if it exists */
export async function deleteSessionFile(name) {
  if (await sessionFileExists(name)) {
    await fsp.unlink(getSessionPath(name));
  }
}
