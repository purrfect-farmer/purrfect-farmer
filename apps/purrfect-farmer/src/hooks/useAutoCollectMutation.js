import { useMutation, useQueryClient } from "@tanstack/react-query";

import AutoBooster from "@/lib/AutoBooster";
import Decimal from "decimal.js";
import useAuto from "./useAuto";
import useAutoMaster from "./useAutoMaster";
import useAutoProgress from "./useAutoProgress";

export default function useAutoCollectMutation() {
  const { config } = useAuto();
  const { decryptPhrase, prepare } = useAutoMaster();
  const queryClient = useQueryClient();
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useAutoProgress();

  const mutation = useMutation({
    mutationKey: [config.id, "collect"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.id, "balances"] });
    },
    mutationFn: async ({ accounts }) => {
      resetProgress();
      setTarget(accounts.length);

      // Decrypt and prepare master once, then reuse
      const { masterData, prepared } = await prepare();

      const results = [];

      for (const account of accounts) {
        // Decrypt account phrase
        const accountPhrase = await decryptPhrase(account.encryptedPhrase);

        const booster = new AutoBooster(
          masterData,
          {
            ...account,
            phrase: accountPhrase,
          },
          prepared,
          { token: config.token },
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
