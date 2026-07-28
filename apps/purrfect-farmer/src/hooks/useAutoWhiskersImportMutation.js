import { encryption } from "@/services/encryption";
import { getWalletAddressFromMnemonic } from "@purrfect/shared/lib/auto/wallet";
import { mnemonicNew } from "@ton/crypto";
import useAuto from "./useAuto";
import useAutoProgress from "./useAutoProgress";
import useAutoStateBackup from "./useAutoStateBackup";
import { useMutation } from "@tanstack/react-query";
import { uuid } from "@/utils";

/**
 * Turns Whiskers accounts into this drop's accounts.
 *
 * A Whiskers backup carries no wallets — only Telegram identities — so an
 * account that is already here keeps the wallet it has and only takes the
 * Whiskers title, and one that isn't gets a wallet generated for it. Matching
 * is by Telegram user id, the identity that follows a farmed account across
 * every drop.
 *
 * Generating is cheap but encrypting is a scrypt pass at N = 2**15 each, so a
 * few hundred new accounts is minutes of work — hence the progress bar, which
 * also covers the pre-import backup.
 */
export default function useAutoWhiskersImportMutation() {
  const { config, master, password, accounts, dispatchAndStoreAccounts } =
    useAuto();

  const { downloadStateBackup, backupSteps } = useAutoStateBackup();

  const progress = useAutoProgress();
  const { setTarget, resetProgress, incrementProgress } = progress;

  const mutation = useMutation({
    mutationKey: [config.id, "whiskers-import"],
    mutationFn: async ({ candidates = [] }) => {
      resetProgress();

      /** The tab only renders behind the login, but never generate unencryptable phrases */
      if (!master || !password) {
        throw new Error(`Set up and unlock ${config.title} first.`);
      }

      if (!candidates.length) {
        throw new Error("No accounts selected to import.");
      }

      setTarget(backupSteps + candidates.length);

      /** Snapshot before anything is rewritten */
      await downloadStateBackup("whiskers-import", incrementProgress);

      /** Title updates, keyed by the account id they apply to */
      const updatedTitles = new Map();
      const newAccounts = [];

      for (const candidate of candidates) {
        if (candidate.existingId) {
          updatedTitles.set(candidate.existingId, candidate.title);
        } else {
          const mnemonic = await mnemonicNew();
          const phrase = mnemonic.join(" ");

          const [address, encryptedPhrase] = await Promise.all([
            getWalletAddressFromMnemonic(phrase, candidate.version),
            encryption.encryptData({ data: phrase, password }),
          ]);

          newAccounts.push({
            id: uuid(),
            title: candidate.title,
            userId: candidate.userId,
            version: candidate.version,
            address,
            encryptedPhrase,
          });
        }

        incrementProgress();
      }

      /** Existing accounts keep their place in the list; new ones follow */
      const merged = accounts
        .map((account) =>
          updatedTitles.has(account.id)
            ? { ...account, title: updatedTitles.get(account.id) }
            : account,
        )
        .concat(newAccounts);

      dispatchAndStoreAccounts(merged);

      return { added: newAccounts.length, updated: updatedTitles.size };
    },
  });

  return { mutation, progress };
}
