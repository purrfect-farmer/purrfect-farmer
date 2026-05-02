import { downloadFile } from "@/utils";
import { encryption } from "@/services/encryption";
import useATFAuto from "./useATFAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useATFAutoSweepMutation() {
  const { auth, cloudBackend } = useCloudQueryOptions();
  const { accounts, password, dispatchAndStoreAccounts } = useATFAuto();

  return useMutation({
    mutationKey: ["atf-auto", "sweep"],
    mutationFn: async () => {
      /** Get User ID of active farmers */
      const activeIds = await cloudBackend
        .post("/api/atf-auto/get-active-list", { auth })
        .then((res) => res.data);

      /** Get accounts to sweep */
      const accountsToSweep = accounts.filter(
        (item) => !activeIds.includes(Number(item.userId)),
      );

      /** Return when there are not accounts to sweep */
      if (!accountsToSweep.length) return;

      /** Initialize backups array */
      const backups = [];

      for (const account of accountsToSweep) {
        /** Decrypt phrase */
        const phrase = await encryption.decryptData({
          ...account.encryptedPhrase,
          password,
          asText: true,
        });

        /** Remove encryptedPhrase */
        delete account.encryptedPhrase;

        /** Push backup */
        backups.push({
          ...account,
          phrase,
        });
      }

      /** Download backup file immediately */
      downloadFile(`atf-accounts-sweep-backup-${Date.now()}.json`, {
        accounts: backups,
      });

      /** Extract IDs to sweep */
      const idsToSweep = accountsToSweep.map((item) => item.id);

      /** Filter accounts */
      const updatedAccounts = accounts.filter(
        (item) => !idsToSweep.includes(item.id),
      );

      /** Store accounts */
      dispatchAndStoreAccounts(updatedAccounts);
    },
  });
}
