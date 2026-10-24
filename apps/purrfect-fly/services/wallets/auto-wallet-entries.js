import { WALLET_PUSH_SCOPE } from "@purrfect/shared/enums/wallet-push-scope.js";
import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role.js";

/** Thrown when a push names a wallet the server cannot store */
export class WalletPushError extends Error {
  constructor(message) {
    super(message);
    this.name = "WalletPushError";
  }
}

/** Contract version the farmer opens, 4 stays V4 and anything else is W5 */
const toWalletVersion = (version) => (Number(version) === 4 ? 4 : 5);

/** Whether a value is an Encrypter payload */
const isEncryptedPayload = (value) =>
  typeof value?.encrypted === "string" && typeof value?.salt === "string";

/** One wallet to store, checked so a bad entry fails the whole push */
function createEntry({ role, accountId, version, encryptedPhrase }) {
  if (!isEncryptedPayload(encryptedPhrase)) {
    throw new WalletPushError("A wallet has no encrypted phrase");
  }

  if (role === WALLET_ROLE.ACCOUNT && !/^\d+$/.test(String(accountId))) {
    throw new WalletPushError("An account has no Telegram user id");
  }

  return {
    role,
    accountId: role === WALLET_ROLE.ACCOUNT ? String(accountId) : null,
    version: toWalletVersion(version),
    encryptedPhrase,
  };
}

/** The Auto wallets a push stores, picked by its scope */
export function getAutoWalletEntries({ master, accounts = [], pushScope }) {
  const entries = [];

  if (pushScope !== WALLET_PUSH_SCOPE.ACCOUNTS) {
    entries.push(
      createEntry({
        role: WALLET_ROLE.MASTER,
        version: master?.version,
        encryptedPhrase: master?.encryptedWalletPhrase,
      }),
    );
  }

  if (pushScope !== WALLET_PUSH_SCOPE.MASTER) {
    for (const account of accounts) {
      entries.push(
        createEntry({
          role: WALLET_ROLE.ACCOUNT,
          accountId: account?.userId,
          version: account?.version,
          encryptedPhrase: account?.encryptedPhrase,
        }),
      );
    }
  }

  if (entries.length === 0) {
    throw new WalletPushError("No wallets to push");
  }

  return entries;
}
