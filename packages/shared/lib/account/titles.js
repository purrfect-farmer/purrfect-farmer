/** The longest title an account may have */
export const MAX_ACCOUNT_TITLE_LENGTH = 255;

/** The most titles one update may carry */
export const MAX_ACCOUNT_TITLE_UPDATES = 5000;

/** The title updates that are valid, trimmed and one per account id, the last one winning */
export function normalizeTitleUpdates(updates) {
  const titles = new Map();

  for (const update of Array.isArray(updates) ? updates : []) {
    const id = Number(update?.id);
    const title = typeof update?.title === "string" ? update.title.trim() : "";

    if (!Number.isSafeInteger(id) || id <= 0) continue;
    if (!title || title.length > MAX_ACCOUNT_TITLE_LENGTH) continue;

    titles.set(id, title);
  }

  return titles;
}
