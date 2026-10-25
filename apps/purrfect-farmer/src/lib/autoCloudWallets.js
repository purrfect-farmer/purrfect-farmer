import { CLOUD_WALLET_STATUS } from "@/constants/cloudWalletStatus";
import { isSameAddress } from "./autoSnapshot";
import { keyPairFromPhraseOrSecretKey } from "@purrfect/shared/lib/ton/wallet";
import { WALLET_PUSH_SCOPE } from "@purrfect/shared/enums/wallet-push-scope";
import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role";

/** Store an Auto's wallets on the Cloud server, which decrypts them with the Auto's password and removes the ones they replace */
export function pushAutoCloudWallets(
  cloudBackend,
  { drop, auth, password, master, accounts = [], pushScope, replaces = [] },
) {
  return cloudBackend
    .post(`/api/auto/${drop}/push-wallets`, {
      auth,
      password,
      master,
      accounts,
      pushScope,
      replaces,
    })
    .then((res) => res.data);
}

/** The wallets the Cloud server stores for an Auto, without their phrases */
export function fetchAutoCloudWallets(cloudBackend, { drop, auth, signal }) {
  return cloudBackend
    .post(`/api/auto/${drop}/wallets`, { auth }, { signal })
    .then((res) => res.data);
}

/** Group the stored wallets into the masters and each account's by Telegram user id, as several may be stored for one */
export function indexCloudWallets(rows) {
  const masters = rows.filter((row) => row.role === WALLET_ROLE.MASTER);
  const accounts = Map.groupBy(
    rows.filter((row) => row.role === WALLET_ROLE.ACCOUNT && row.accountId),
    (row) => row.accountId,
  );

  return { masters, accounts };
}

/** The stored wallet matching the one the Auto holds, else any other stored for it */
function findCloudWallet(rows, wallet) {
  if (!rows?.length) return null;

  return (
    rows.find((row) => isSameAddress(row.address, wallet?.address)) || rows[0]
  );
}

/** The stored copy of the Auto's master */
export const getMasterCloudWallet = (index, master) =>
  findCloudWallet(index.masters, master);

/** The stored copy of an account's wallet */
export const getAccountCloudWallet = (index, account) =>
  findCloudWallet(index.accounts.get(String(account.userId)), account);

/** Contract version a wallet opens, 4 stays V4 and anything else is W5 */
const toWalletVersion = (version) => (Number(version) === 4 ? 4 : 5);

/** How a wallet the Auto holds compares with the stored row */
export function getCloudWalletStatus(row, wallet) {
  if (!row) return CLOUD_WALLET_STATUS.MISSING;

  const sameVersion =
    toWalletVersion(row.version) === toWalletVersion(wallet?.version);
  const sameAddress = isSameAddress(row.address, wallet?.address);

  return sameVersion && sameAddress
    ? CLOUD_WALLET_STATUS.PUSHED
    : CLOUD_WALLET_STATUS.OUTDATED;
}

/** Hex public key of a phrase, which stays the same across wallet versions */
export async function getPhrasePublicKey(phrase) {
  const { publicKey } = await keyPairFromPhraseOrSecretKey(phrase);

  return publicKey.toString("hex");
}

/** The removal entry for an Auto's master wallet */
export const masterWalletRemoval = (publicKey) => ({
  publicKey,
  role: WALLET_ROLE.MASTER,
});

/** The removal entry for an Auto account's wallet */
export const accountWalletRemoval = (publicKey, userId) => ({
  publicKey,
  role: WALLET_ROLE.ACCOUNT,
  accountId: String(userId),
});

/** The server's reason for a failed Cloud request, or the request's own */
export const getCloudErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Unknown error";

/** The push scope for the chosen wallets, or null when nothing is chosen */
export function getWalletPushScope(includeMaster, includeAccounts) {
  if (includeMaster && includeAccounts) return WALLET_PUSH_SCOPE.ALL;
  if (includeMaster) return WALLET_PUSH_SCOPE.MASTER;
  if (includeAccounts) return WALLET_PUSH_SCOPE.ACCOUNTS;

  return null;
}

/** Push button label for the chosen wallets */
export function getWalletPushLabel(pushScope) {
  switch (pushScope) {
    case WALLET_PUSH_SCOPE.ALL:
      return "Push all Wallets";
    case WALLET_PUSH_SCOPE.MASTER:
      return "Push Master Wallet";
    case WALLET_PUSH_SCOPE.ACCOUNTS:
      return "Push Account Wallets";
    default:
      return "Nothing to push";
  }
}
