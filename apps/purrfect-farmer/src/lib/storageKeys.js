/** Storage key derivation, for anything reading a key it doesn't own outside of React */

/** Key shared by every account */
export function sharedStorageKey(key) {
  return `shared:${key}`;
}

/** Key scoped to a single account */
export function accountStorageKey(accountId, key) {
  return `account-${accountId}:${key}`;
}
