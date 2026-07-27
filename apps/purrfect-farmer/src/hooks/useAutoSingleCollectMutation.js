import { useMutation, useQueryClient } from "@tanstack/react-query";

import AutoBooster from "@/lib/AutoBooster";
import useAuto from "./useAuto";
import useAutoMaster from "./useAutoMaster";

export default function useAutoSingleCollectMutation() {
  const { config, master } = useAuto();
  const { decryptPhrase, prepare } = useAutoMaster();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [config.id, "single-collect"],
    onSuccess: (_data, { account }) => {
      queryClient.invalidateQueries({
        queryKey: [config.id, "balances", account.address],
      });
      queryClient.invalidateQueries({
        queryKey: [config.id, "balances", master.address],
      });
    },
    onError: (error) => {
      console.log(`Error while collecting ${config.token} from account`, error);
    },
    mutationFn: async ({ account }) => {
      console.log("Decrypting sub account wallet...");
      const accountPhrase = await decryptPhrase(account.encryptedPhrase);
      console.log("Successfully decrypted sub account wallet");

      console.log("Preparing master wallet...");
      const { masterData, prepared } = await prepare();
      console.log("Successfully prepared master wallet");

      const booster = new AutoBooster(
        masterData,
        { ...account, phrase: accountPhrase },
        prepared,
        { token: config.token },
      );

      console.log("Collecting from account...");
      return booster.collect();
    },
  });

  return mutation;
}
