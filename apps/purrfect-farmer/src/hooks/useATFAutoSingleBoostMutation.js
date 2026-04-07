import ATFAutoBooster, { prepareMaster } from "@/lib/ATFAutoBooster";
import { encryption } from "@/services/encryption";
import { useMutation } from "@tanstack/react-query";
import useATFAuto from "./useATFAuto";

export default function useATFAutoSingleBoostMutation() {
  const { master, password } = useATFAuto();

  const mutation = useMutation({
    mutationKey: ["atf-auto-single-boost"],
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
        toncenterApiKey: master.toncenterApiKey,
      };

      const prepared = await prepareMaster(masterData);

      if (prepared.jettonBalance <= 0) {
        throw new Error("Master has no jetton balance");
      }

      const booster = new ATFAutoBooster(
        masterData,
        { ...account, phrase: accountPhrase },
        prepared
      );

      return booster.boost({ difference });
    },
  });

  return mutation;
}
