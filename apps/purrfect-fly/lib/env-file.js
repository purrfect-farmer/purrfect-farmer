import dotenv from "dotenv";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

/** Boot attempts allowed before a pending env is rolled back */
const MAX_BOOT_ATTEMPTS = 3;

/** Number of env backups to keep */
const MAX_BACKUPS = 10;

/** Matches an assignment line and captures its key */
const ASSIGNMENT_REGEX = /^\s*(?:export\s+)?([\w.-]+)\s*=/;

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
  const replaced = new Map();
  const removed = new Set();
  const added = [];

  for (const [key, value] of Object.entries(changes)) {
    const matches = entries.filter((entry) => entry.key === key);

    if (value === null) {
      matches.forEach((entry) => removed.add(entry));
    } else if (matches.length) {
      matches.forEach((entry) =>
        replaced.set(entry, `${entry.prefix}${formatValue(value)}${entry.trailing}`),
      );
    } else {
      added.push([key, value]);
    }
  }

  /** Rebuild the file with replacements in place */
  const output = [];
  const lastLineOfSection = new Map();

  for (let i = 0; i < lines.length; i++) {
    const entry = entries.find((item) => item.start === i);

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
        !covered.has(index) && line.trim() !== "" && !line.trim().startsWith("#"),
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

/** Line diff between two contents using LCS */
export function diffLines(before, after) {
  const a = splitLines(before);
  const b = splitLines(after);
  const table = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result = [];
  let i = 0;
  let j = 0;

  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      result.push({ type: "same", line: a[i] });
      i++;
      j++;
    } else if (j < b.length && (i >= a.length || table[i][j + 1] > table[i + 1][j])) {
      result.push({ type: "added", line: b[j] });
      j++;
    } else {
      result.push({ type: "removed", line: a[i] });
      i++;
    }
  }

  return result;
}

/** Short preview of a secret */
export function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 3)}•••${value.slice(-3)}`;
}

/** Replace secret values in a single env line */
export function maskLine(line, secretKeys) {
  const match = line.match(ASSIGNMENT_REGEX);
  if (!match || !secretKeys.has(match[1])) return line;

  const value = parseEnv(line)[match[1]] ?? "";
  return `${match[0]}${value ? maskSecret(value) : '""'}`;
}

/** Env file manager bound to a base path */
export function createEnvStore(basePath) {
  const envPath = path.resolve(basePath, ".env");
  const pendingPath = path.resolve(basePath, ".env.pending");
  const restoredPath = path.resolve(basePath, ".env.restored");
  const backupsPath = path.resolve(basePath, "backups/env");

  const readEnv = () => fsp.readFile(envPath, "utf-8").catch(() => "");

  /** Copy the current env into a timestamped backup */
  const createBackup = async () => {
    await fsp.mkdir(backupsPath, { recursive: true });

    const name = `${new Date().toISOString().replace(/[:.]/g, "-")}.env`;
    await fsp.writeFile(path.join(backupsPath, name), await readEnv(), "utf-8");

    /** Prune old backups */
    const names = await listBackupNames();
    await Promise.all(
      names
        .slice(MAX_BACKUPS)
        .map((item) => fsp.rm(path.join(backupsPath, item), { force: true })),
    );

    return name;
  };

  /** Backup names, newest first */
  const listBackupNames = async () => {
    const names = await fsp.readdir(backupsPath).catch(() => []);
    return names.filter((name) => name.endsWith(".env")).sort().reverse();
  };

  /** Backups with their size and date */
  const listBackups = async () => {
    const names = await listBackupNames();

    return Promise.all(
      names.map(async (name) => {
        const stat = await fsp.stat(path.join(backupsPath, name));
        return { name, size: stat.size, createdAt: stat.mtime };
      }),
    );
  };

  /** Read a backup by name, refusing anything outside the folder */
  const readBackup = async (name) => {
    if (path.basename(name) !== name || !name.endsWith(".env")) {
      throw new Error("Invalid backup name");
    }

    return fsp.readFile(path.join(backupsPath, name), "utf-8");
  };

  /** Back up, write the new env and arm the boot guard */
  const writeEnv = async (content) => {
    const backup = await createBackup();

    await fsp.writeFile(envPath, content, "utf-8");
    await fsp.writeFile(
      pendingPath,
      JSON.stringify({ backup, attempts: 0, createdAt: new Date() }),
      "utf-8",
    );

    return backup;
  };

  /**
   * Runs before dotenv loads: counts boots of a pending env and rolls it back
   * once it has failed to start too many times
   */
  const runBootGuard = () => {
    if (!fs.existsSync(pendingPath)) return null;

    try {
      const pending = JSON.parse(fs.readFileSync(pendingPath, "utf-8"));
      pending.attempts = (pending.attempts || 0) + 1;

      if (pending.attempts < MAX_BOOT_ATTEMPTS) {
        fs.writeFileSync(pendingPath, JSON.stringify(pending), "utf-8");
        return null;
      }

      const backup = fs.readFileSync(
        path.join(backupsPath, path.basename(pending.backup)),
        "utf-8",
      );

      fs.writeFileSync(envPath, backup, "utf-8");
      fs.writeFileSync(
        restoredPath,
        JSON.stringify({ backup: pending.backup, restoredAt: new Date() }),
        "utf-8",
      );
      fs.rmSync(pendingPath, { force: true });

      return pending.backup;
    } catch (error) {
      console.error("Env boot guard failed:", error);
      fs.rmSync(pendingPath, { force: true });
      return null;
    }
  };

  /** Called once the server listens: the env is good */
  const confirmBoot = async () => {
    await fsp.rm(pendingPath, { force: true });

    const restored = await fsp
      .readFile(restoredPath, "utf-8")
      .then((content) => JSON.parse(content))
      .catch(() => null);

    if (restored) await fsp.rm(restoredPath, { force: true });

    return restored;
  };

  return {
    envPath,
    readEnv,
    writeEnv,
    listBackups,
    readBackup,
    runBootGuard,
    confirmBoot,
  };
}
