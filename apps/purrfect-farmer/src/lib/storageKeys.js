/**
 * Storage key derivation.
 *
 * `useChromeStorageKey` is the usual way in, but anything that reads a key it
 * doesn't own — the Auto import flow reading another drop's store, for instance
 * — needs the same rules outside of React.
 */

/** Key shared by every account */
export function sharedStorageKey(key) {
  return `shared:${key}`;
}

/** Key scoped to a single account */
export function accountStorageKey(accountId, key) {
  return `account-${accountId}:${key}`;
}
