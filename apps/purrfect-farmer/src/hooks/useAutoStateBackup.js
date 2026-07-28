import { downloadFile } from "@/utils";
import toast from "react-hot-toast";
import useAuto from "./useAuto";
import useAutoMaster from "./useAutoMaster";
import { useCallback } from "react";

/**
 * Downloads every wallet this drop holds, before something rewrites them.
 *
 * An import folds another wallet set into this one — accounts get overwritten,
 * titles change, and with `replace` the current list is dropped outright. The
 * stored blobs are only recoverable with the password, so the snapshot is taken
 * in plaintext: it survives a forgotten password, which is the case a snapshot
 * exists for. That makes the file worth exactly as much as the wallets, and the
 * import forms say so.
 *
 * Decrypting is a scrypt pass at N = 2**15 per wallet, so a drop with fifty
 * accounts spends ten-odd seconds here. `onStep` is called per wallet so the
 * caller's progress bar keeps moving rather than looking hung.
 */
export default function useAutoStateBackup() {
  const { config, master, accounts } = useAuto();
  const { decryptPhrase } = useAutoMaster();

  /** The number of `onStep` calls a backup will make, for `setTarget` */
  const backupSteps = master ? accounts.length + 1 : 0;

  const downloadStateBackup = useCallback(
    async (label, onStep) => {
      /** Nothing set up yet means nothing worth keeping */
      if (!master) {
        return false;
      }

      const masterPhrase = await decryptPhrase(master.encryptedWalletPhrase);

      onStep?.();

      const backedUpAccounts = [];

      for (const account of accounts) {
        backedUpAccounts.push({
          id: account.id,
          title: account.title,
          userId: account.userId,
          version: account.version,
          address: account.address,
          phrase: await decryptPhrase(account.encryptedPhrase),
        });

        onStep?.();
      }

      downloadFile(`${config.id}-${label}-backup-${Date.now()}.json`, {
        auto: config.id,
        title: config.title,
        createdAt: new Date().toISOString(),
        master: {
          address: master.address,
          version: master.version,
          tonCenterApiKey: master.tonCenterApiKey || "",
          phrase: masterPhrase,
        },
        accounts: backedUpAccounts,
      });

      toast.success("Backup of current wallets downloaded before import!");

      return true;
    },
    [config, master, accounts, decryptPhrase],
  );

  return { downloadStateBackup, backupSteps };
}
