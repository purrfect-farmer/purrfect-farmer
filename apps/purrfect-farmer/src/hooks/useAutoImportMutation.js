import bcrypt from "bcryptjs";
import { encryption } from "@/services/encryption";
import { mergeAccounts } from "@/lib/autoTransfer";
import useAuto from "./useAuto";
import useAutoProgress from "./useAutoProgress";
import useAutoStateBackup from "./useAutoStateBackup";
import { useMutation } from "@tanstack/react-query";

/**
 * Imports a transfer bundle into the current drop.
 *
 * Re-encrypting a phrase costs two scrypt passes at N = 2**15, so the two cases
 * where it can be avoided are worth taking:
 *
 * - **Bootstrap** — the drop has no master yet, so it adopts the bundle's
 *   `hashedPassword` and the source password becomes its password. Nothing is
 *   re-encrypted and the user lands straight in the panel.
 * - **Same password** — the encrypted blobs already open with the destination's
 *   password, so they are copied verbatim.
 *
 * Otherwise every phrase is decrypted with the source password and re-encrypted
 * with the destination's, reporting progress the way `AutoSettingsDialog` does.
 *
 * Whatever the path, the wallets already here are downloaded first — an import
 * can overwrite them and `replace` drops them outright.
 */
export default function useAutoImportMutation() {
  const {
    config,
    master,
    password,
    accounts,
    dispatchAndStoreMaster,
    dispatchAndStoreAccounts,
    dispatchAndSetPassword,
  } = useAuto();

  const { downloadStateBackup, backupSteps } = useAutoStateBackup();

  const progress = useAutoProgress();
  const { setTarget, resetProgress, incrementProgress } = progress;

  const mutation = useMutation({
    mutationKey: [config.id, "import"],
    mutationFn: async ({
      bundle,
      sourcePassword,
      accounts: selected = [],
      importMaster = false,
      strategy = "skip",
    }) => {
      resetProgress();

      /** A drop with no master can only be set up from a bundle that has one */
      const bootstrap = !master;

      if (bootstrap && !bundle.master) {
        throw new Error(
          "This export has no master wallet, so it cannot set up a new Auto.",
        );
      }

      /** A master can only be imported from a bundle that carries one */
      const withMaster = importMaster && Boolean(bundle.master);

      if (!selected.length && !withMaster) {
        throw new Error("Nothing selected to import.");
      }

      /**
       * Verify the source password up front. The bundle's own hash is the cheap
       * check; without a master the only proof is a trial decryption.
       */
      if (bundle.master) {
        const matches = await bcrypt.compare(
          sourcePassword,
          bundle.master.hashedPassword,
        );

        if (!matches) {
          throw new Error("Invalid password for the imported wallets!");
        }
      } else {
        try {
          await encryption.decryptData({
            ...selected[0].encryptedPhrase,
            password: sourcePassword,
            asText: true,
          });
        } catch {
          throw new Error("Invalid password for the imported wallets!");
        }
      }

      const destinationPassword = bootstrap ? sourcePassword : password;
      const reencrypt = destinationPassword !== sourcePassword;

      setTarget(backupSteps + selected.length + (withMaster ? 1 : 0));

      /**
       * Snapshot before anything is rewritten. A bootstrapping drop has no
       * wallets of its own yet, and `downloadStateBackup` no-ops there.
       */
      await downloadStateBackup("import", incrementProgress);

      /** Master */
      let importedMaster = null;

      if (withMaster) {
        importedMaster = {
          ...bundle.master,
          /** Signing in always stays against this drop's own password */
          hashedPassword: bootstrap
            ? bundle.master.hashedPassword
            : master.hashedPassword,
          tonCenterApiKey:
            bundle.master.tonCenterApiKey || master?.tonCenterApiKey || "",
        };

        if (reencrypt) {
          const phrase = await encryption.decryptData({
            ...bundle.master.encryptedWalletPhrase,
            password: sourcePassword,
            asText: true,
          });

          importedMaster.encryptedWalletPhrase = await encryption.encryptData({
            data: phrase,
            password: destinationPassword,
          });
        }

        incrementProgress();
      }

      /** Accounts */
      const importedAccounts = [];

      for (const account of selected) {
        let encryptedPhrase = account.encryptedPhrase;

        if (reencrypt) {
          const phrase = await encryption.decryptData({
            ...encryptedPhrase,
            password: sourcePassword,
            asText: true,
          });

          encryptedPhrase = await encryption.encryptData({
            data: phrase,
            password: destinationPassword,
          });
        }

        importedAccounts.push({ ...account, encryptedPhrase });

        incrementProgress();
      }

      const merged = mergeAccounts(accounts, importedAccounts, strategy);

      /** Persist — mirrored so other open views follow */
      if (importedMaster) {
        dispatchAndStoreMaster(importedMaster);
      }

      dispatchAndStoreAccounts(merged.accounts);

      if (bootstrap) {
        dispatchAndSetPassword(destinationPassword);
      }

      return { ...merged, bootstrap };
    },
  });

  return { mutation, progress };
}
