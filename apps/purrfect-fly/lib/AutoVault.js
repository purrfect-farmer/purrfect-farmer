/**
 * The wallets a server has been handed, kept in memory only.
 *
 * The periodic assist loop has no request to carry the password that unlocks
 * an account's phrase, so `Load` leaves both here. Nothing is persisted: a
 * restart empties the vault and the loop idles until `Load` runs again.
 */
const vaults = new Map();

/** Index the accounts by the Telegram user they belong to */
const indexAccounts = (accounts) =>
  new Map(
    accounts
      .filter((account) => account.userId)
      .map((account) => [String(account.userId), account]),
  );

/** Store the wallets loaded for a drop, replacing whatever was there */
export function setVault(dropId, { password, accounts = [] }) {
  const vault = {
    password,
    accounts: indexAccounts(accounts),
    loadedAt: Date.now(),
  };

  vaults.set(dropId, vault);

  return vault;
}

/** Retrieve a drop's vault */
export function getVault(dropId) {
  return vaults.get(dropId);
}

/** Forget a drop's wallets */
export function clearVault(dropId) {
  return vaults.delete(dropId);
}

/** What the vault holds, without ever revealing a phrase */
export function summarizeVault(dropId) {
  const vault = vaults.get(dropId);

  if (!vault) {
    return { loaded: false, accounts: 0, verified: [], loadedAt: null };
  }

  const accounts = [...vault.accounts.values()];

  return {
    loaded: true,
    accounts: accounts.length,
    verified: accounts
      .filter((account) => account.verified)
      .map((account) => String(account.userId)),
    loadedAt: vault.loadedAt,
  };
}
