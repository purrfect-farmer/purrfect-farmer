import ATFAutoBooster, { prepareMaster } from "@/lib/ATFAutoBooster";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { encryption } from "@/services/encryption";
import useATFAuto from "./useATFAuto";
import useATFAutoProgress from "./useATFAutoProgress";

export default function useATFAutoBoostMutation() {
  const { master, password } = useATFAuto();
  const queryClient = useQueryClient();
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useATFAutoProgress();

  const mutation = useMutation({
    mutationKey: ["atf-auto-boost"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atf-balances"] });
      queryClient.invalidateQueries({ queryKey: ["atf-wallet-holding"] });
    },
    mutationFn: async ({ accounts, difference }) => {
      resetProgress();
      setTarget(accounts.length);

      // Decrypt master phrase
      const masterPhrase = await encryption.decryptData({
        ...master.encryptedWalletPhrase,
        password,
        asText: true,
      });

      const masterData = {
        address: master.address,
        version: master.version,
        phrase: masterPhrase,
        tonCenterApiKey: master.tonCenterApiKey,
      };

      // Prepare master once and reuse
      const prepared = await prepareMaster(masterData);

      if (prepared.jettonBalance <= 0) {
        throw new Error("Master has no jetton balance");
      }

      const results = [];

      for (const account of accounts) {
        // Decrypt account phrase
        const accountPhrase = await encryption.decryptData({
          ...account.encryptedPhrase,
          password,
          asText: true,
        });

        const booster = new ATFAutoBooster(
          masterData,
          {
            ...account,
            phrase: accountPhrase,
          },
          prepared,
        );

        const result = await booster.boost({ difference });

        results.push(result);
        incrementProgress();

        /* Random delay up to 1 minute between accounts */
        if (account !== accounts[accounts.length - 1]) {
          const delay = 10_000 + Math.floor(Math.random() * 50_000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      return { results };
    },
  });

  return { mutation, target, progress };
}
