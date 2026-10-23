import dotenv from "dotenv";

/** Matches an assignment line and captures its key */
export const ASSIGNMENT_REGEX = /^\s*(?:export\s+)?([\w.-]+)\s*=/;

/** Valid key names */
const KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Split content into lines without the trailing empty one */
const splitLines = (content) => {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 1 && lines.at(-1) === "") lines.pop();
  return lines;
};

/** Index where a quoted value closes, or -1 */
const findClosingQuote = (text, quote, start) => {
  for (let i = start; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === quote) return i;
  }
  return -1;
};

/** Parse lines into entries that remember where each assignment lives */
export function parseEntries(content) {
  const lines = splitLines(content);
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(ASSIGNMENT_REGEX);
    if (!match) continue;

    const prefix = match[0];
    const rest = lines[i].slice(prefix.length);
    const valueStart = rest.length - rest.trimStart().length;
    const quote = rest[valueStart];
    let end = i;
    let trailing = "";

    if (quote === '"' || quote === "'" || quote === "`") {
      /** Quoted values may span several lines */
      let close = findClosingQuote(rest, quote, valueStart + 1);
      let tail = rest;

      while (close === -1 && end + 1 < lines.length) {
        end++;
        tail = lines[end];
        close = findClosingQuote(tail, quote, 0);
      }

      trailing = close === -1 ? "" : tail.slice(close + 1);
    } else {
      const hash = rest.search(/\s#/);
      trailing = hash === -1 ? "" : rest.slice(hash);
    }

    entries.push({ key: match[1], start: i, end, prefix, trailing });
  }

  return { lines, entries };
}

/** Lines that are neither blank, comments nor assignments */
export function findInvalidLines(content) {
  const { lines, entries } = parseEntries(content);
  const covered = new Set();

  entries.forEach((entry) => {
    for (let i = entry.start; i <= entry.end; i++) covered.add(i);
  });

  return lines
    .map((line, index) => ({ line, index }))
    .filter(
      ({ line, index }) =>
        !covered.has(index) &&
        line.trim() !== "" &&
        !line.trim().startsWith("#"),
    )
    .map(({ index }) => index + 1);
}

/** Parse env content into a key/value map */
export function parseEnv(content) {
  return dotenv.parse(content);
}

/** Validate a key name */
export function isValidKey(key) {
  return KEY_REGEX.test(key);
}
