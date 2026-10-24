import { pushAutoCloudWallets } from "@/lib/autoCloudWallets";
import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

/** Pushes the Auto's master and / or accounts to the Cloud server's wallet store */
export default function useAutoCloudWalletsPushMutation() {
  const { config, password, master } = useAuto();
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: [config.id, "cloud", "wallets-push"],
    onError: (error) => {
      console.log("Error while pushing wallets to Cloud", error);
    },
    mutationFn: ({ pushScope, accounts }) =>
      pushAutoCloudWallets(cloudBackend, {
        drop: config.id,
        auth,
        password,
        master,
        accounts,
        pushScope,
      }),
  });
}
