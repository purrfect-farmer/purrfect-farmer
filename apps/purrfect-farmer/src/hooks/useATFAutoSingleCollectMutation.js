import ATFAutoBooster, { prepareMaster } from "@/lib/ATFAutoBooster";
import { encryption } from "@/services/encryption";
import { useMutation } from "@tanstack/react-query";
import useATFAuto from "./useATFAuto";

export default function useATFAutoSingleCollectMutation() {
  const { master, password } = useATFAuto();

  const mutation = useMutation({
    mutationKey: ["atf-auto-single-collect"],
    mutationFn: async ({ account }) => {
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
        toncenterApiKey: master.toncenterApiKey,
      };

      const prepared = await prepareMaster(masterData);

      const booster = new ATFAutoBooster(
        masterData,
        { ...account, phrase: accountPhrase },
        prepared
      );

      return booster.collect();
    },
  });

  return mutation;
}
