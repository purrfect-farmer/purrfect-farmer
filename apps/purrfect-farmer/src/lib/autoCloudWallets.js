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
