import { useMutation, useQueryClient } from "@tanstack/react-query";

import ATFAutoBooster from "@/lib/ATFAutoBooster";
import { encryption } from "@/services/encryption";
import { prepareMaster } from "@/lib/atf-auto-transactions";
import useATFAuto from "./useATFAuto";

export default function useATFAutoSingleBoostMutation() {
  const { master, password } = useATFAuto();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["atf-auto-single-boost"],
    onSuccess: (_data, { account }) => {
      queryClient.invalidateQueries({
        queryKey: ["atf-balances", account.address],
      });
      queryClient.invalidateQueries({
        queryKey: ["atf-balances", master.address],
      });
    },
    onError: (error) => {
      console.log("Error while boosting account", error);
    },
    mutationFn: async ({ account, difference }) => {
      console.log("Decrypting master wallet....");
      const masterPhrase = await encryption.decryptData({
        ...master.encryptedWalletPhrase,
        password,
        asText: true,
      });
      console.log("Successfully decrypted master wallet!");

      console.log("Decrypting sub account wallet...");
      const accountPhrase = await encryption.decryptData({
        ...account.encryptedPhrase,
        password,
        asText: true,
      });
      console.log("Successfully decrypted sub account wallet");

      const masterData = {
        address: master.address,
        version: master.version,
        phrase: masterPhrase,
        tonCenterApiKey: master.tonCenterApiKey,
      };

      console.log("Preparing master wallet...");
      const prepared = await prepareMaster(masterData);
      console.log("Successfully prepared master wallet");

      if (prepared.jettonBalance <= 0) {
        throw new Error("Master has no jetton balance");
      }

      const booster = new ATFAutoBooster(
        masterData,
        { ...account, phrase: accountPhrase },
        prepared,
      );

      console.log("Boosting account with difference of " + difference);
      return booster.boost({ difference });
    },
  });

  return mutation;
}
