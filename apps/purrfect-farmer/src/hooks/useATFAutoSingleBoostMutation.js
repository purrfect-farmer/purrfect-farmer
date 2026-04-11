import ATFAutoBooster, { prepareMaster } from "@/lib/ATFAutoBooster";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { encryption } from "@/services/encryption";
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
    mutationFn: async ({ account, difference }) => {
      const masterPhrase = await encryption.decryptData({
        ...master.encryptedWalletPhrase,
        password,
        asText: true,
      });

      const accountPhrase = await encryption.decryptData({
        ...account.encryptedPhrase,
        password,
        asText: true,
      });

      const masterData = {
        address: master.address,
        version: master.version,
        phrase: masterPhrase,
        tonCenterApiKey: master.tonCenterApiKey,
      };

      const prepared = await prepareMaster(masterData);

      if (prepared.jettonBalance <= 0) {
        throw new Error("Master has no jetton balance");
      }

      const booster = new ATFAutoBooster(
        masterData,
        { ...account, phrase: accountPhrase },
        prepared,
      );

      return booster.boost({ difference });
    },
  });

  return mutation;
}
