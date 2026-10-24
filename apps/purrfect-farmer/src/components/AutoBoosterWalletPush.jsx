import AutoWalletsPushResult from "./AutoWalletsPushResult";
import { MdCloudUpload } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import { WALLET_PUSH_SCOPE } from "@purrfect/shared/enums/wallet-push-scope";
import useAutoCloudWalletsPushMutation from "@/hooks/useAutoCloudWalletsPushMutation";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";

/** Pushes one account's wallet to the Cloud server */
export default function AutoBoosterWalletPush({ account }) {
  const { enabled: cloudEnabled } = useCloudQueryOptions();
  const mutation = useAutoCloudWalletsPushMutation();

  if (!cloudEnabled) return null;

  const pushWallet = () => {
    mutation.mutate({
      pushScope: WALLET_PUSH_SCOPE.ACCOUNTS,
      accounts: [account],
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <PrimaryButton onClick={pushWallet} disabled={mutation.isPending}>
        <MdCloudUpload className="size-4" />
        {mutation.isPending ? "Pushing..." : "Push wallet to server"}
      </PrimaryButton>

      <AutoWalletsPushResult data={mutation.data} error={mutation.error} />
    </div>
  );
}
