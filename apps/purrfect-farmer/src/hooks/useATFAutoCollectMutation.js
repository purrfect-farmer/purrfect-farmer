import { useMutation, useQueryClient } from "@tanstack/react-query";

import ATFAutoBooster from "@/lib/ATFAutoBooster";
import Decimal from "decimal.js";
import { encryption } from "@/services/encryption";
import { prepareMaster } from "@purrfect/shared/lib/atf-auto-transactions";
import useATFAuto from "./useATFAuto";
import useATFAutoProgress from "./useATFAutoProgress";

export default function useATFAutoCollectMutation() {
  const { master, password } = useATFAuto();
  const queryClient = useQueryClient();
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useATFAutoProgress();

  const mutation = useMutation({
    mutationKey: ["atf-auto-collect"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atf-balances"] });
      queryClient.invalidateQueries({ queryKey: ["atf-wallet-holding"] });
    },
    mutationFn: async ({ accounts }) => {
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

        const result = await booster.collect();

        results.push(result);
        incrementProgress();
      }

      const totalCollected = results.reduce(
        (sum, r) => (r.collected ? sum.plus(r.collected) : sum),
        new Decimal(0),
      );

      return { results, totalCollected: totalCollected.toFixed() };
    },
  });

  return { mutation, target, progress };
}
