import ATFAutoBooster, { prepareMaster } from "@/lib/ATFAutoBooster";
import { encryption } from "@/services/encryption";
import { useMutation } from "@tanstack/react-query";
import useATFAuto from "./useATFAuto";
import useATFAutoProgress from "./useATFAutoProgress";

export default function useATFAutoBoostMutation() {
  const { master, password } = useATFAuto();
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useATFAutoProgress();

  const mutation = useMutation({
    mutationKey: ["atf-auto-boost"],
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
        toncenterApiKey: master.toncenterApiKey,
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

        const booster = new ATFAutoBooster(masterData, {
          ...account,
          phrase: accountPhrase,
        }, prepared);

        const result = await booster.boost({ difference });

        results.push(result);
        incrementProgress();
      }

      return { results };
    },
  });

  return { mutation, target, progress };
}
