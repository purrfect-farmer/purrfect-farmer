import { ASSIGNMENT_REGEX, parseEnv } from "./parse.js";
import { formatPatch, structuredPatch } from "diff";

/** Unchanged lines kept around each change in a diff */
const DIFF_CONTEXT_LINES = 2;

/** Unified diff between two contents with secret values masked, empty when unchanged */
export function createEnvPatch(before, after, secretKeys = new Set()) {
  const patch = structuredPatch(".env", ".env", before, after, "", "", {
    context: DIFF_CONTEXT_LINES,
  });
  if (!patch.hunks.length) return "";

  patch.hunks.forEach((hunk) => {
    hunk.lines = hunk.lines.map((line) =>
      /^[ +-]/.test(line)
        ? line[0] + maskLine(line.slice(1), secretKeys)
        : line,
    );
  });

  return formatPatch(patch);
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
