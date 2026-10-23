import { parseEntries } from "./parse.js";

/** Format a value so dotenv reads it back unchanged */
export function formatValue(value) {
  const text = String(value);

  if (text === "") return '""';
  if (/^-?\d+(\.\d+)?$/.test(text) || /^(true|false)$/.test(text)) {
    return text;
  }
  if (!text.includes('"') && !text.includes("\\")) return `"${text}"`;
  if (!text.includes("'")) return `'${text}'`;
  if (!text.includes("`")) return `\`${text}\``;

  throw new Error("Value cannot contain every kind of quote");
}

/**
 * Apply key changes to env content, keeping comments, order and unknown keys
 *
 * @param {string} content
 * @param {Record<string, string | null>} changes null removes the key
 * @param {(key: string) => string} [sectionOf] groups new keys together
 * @param {(section: string) => string} [sectionTitle] header for new sections
 */
export function applyChanges(content, changes, sectionOf, sectionTitle) {
  const { lines, entries } = parseEntries(content);
  const entriesByKey = Map.groupBy(entries, (entry) => entry.key);
  const entriesByStart = new Map(entries.map((entry) => [entry.start, entry]));
  const replaced = new Map();
  const removed = new Set();
  const added = [];

  for (const [key, value] of Object.entries(changes)) {
    const matches = entriesByKey.get(key) ?? [];

    if (value === null) {
      matches.forEach((entry) => removed.add(entry));
    } else if (matches.length) {
      matches.forEach((entry) =>
        replaced.set(
          entry,
          `${entry.prefix}${formatValue(value)}${entry.trailing}`,
        ),
      );
    } else {
      added.push([key, value]);
    }
  }

  /** Rebuild the file with replacements in place */
  const output = [];
  const lastLineOfSection = new Map();

  for (let i = 0; i < lines.length; i++) {
    const entry = entriesByStart.get(i);

    if (entry && (removed.has(entry) || replaced.has(entry))) {
      if (replaced.has(entry)) output.push(replaced.get(entry));
      i = entry.end;
    } else if (entry) {
      output.push(...lines.slice(i, entry.end + 1));
      i = entry.end;
    } else {
      output.push(lines[i]);
      continue;
    }

    if (entry && sectionOf && !removed.has(entry)) {
      lastLineOfSection.set(sectionOf(entry.key), output.length - 1);
    }
  }

  /** New keys go after the last key of their section, or into a new section */
  const appended = new Map();

  for (const [key, value] of added) {
    const section = sectionOf?.(key) ?? "";
    const line = `${key}=${formatValue(value)}`;
    const index = lastLineOfSection.get(section);

    if (index !== undefined) {
      output.splice(index + 1, 0, line);
      for (const [name, at] of lastLineOfSection) {
        if (at > index) lastLineOfSection.set(name, at + 1);
      }
      lastLineOfSection.set(section, index + 1);
    } else {
      if (!appended.has(section)) appended.set(section, []);
      appended.get(section).push(line);
    }
  }

  for (const [section, sectionLines] of appended) {
    if (output.length && output.at(-1).trim() !== "") output.push("");
    if (section && sectionTitle) output.push(`# ${sectionTitle(section)}`);
    output.push(...sectionLines);
  }

  return output.join("\n") + "\n";
}
