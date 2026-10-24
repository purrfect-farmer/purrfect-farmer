import Alert from "./Alert";
import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import AutoWalletsPushResult from "./AutoWalletsPushResult";
import LabelToggle from "./LabelToggle";
import { MdCloudUpload } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import { WALLET_PUSH_SCOPE } from "@purrfect/shared/enums/wallet-push-scope";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudWalletsPushMutation from "@/hooks/useAutoCloudWalletsPushMutation";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";
import { useState } from "react";

export default function AutoWalletsTab() {
  const { accounts } = useAuto();
  const { enabled: cloudEnabled } = useCloudQueryOptions();
  const [includeAccounts, setIncludeAccounts] = useState(true);
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;

  const mutation = useAutoCloudWalletsPushMutation();
  const disabled = !cloudEnabled || mutation.isPending;

  const pushWallets = () => {
    if (includeAccounts && selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    mutation.mutate({
      pushScope: includeAccounts
        ? WALLET_PUSH_SCOPE.ALL
        : WALLET_PUSH_SCOPE.MASTER,
      accounts: includeAccounts ? selectedAccounts : [],
    });
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <Alert variant="info">
        Stores wallets on the Cloud server, encrypted with its own key. Pushing
        again updates them. Rotation replaces them on its own.
      </Alert>

      {!cloudEnabled ? (
        <Alert variant="warning">Enable the Cloud to push wallets.</Alert>
      ) : null}

      <AutoStickyContainer className="z-10 gap-2">
        {/* Include accounts */}
        <LabelToggle
          onChange={(ev) => setIncludeAccounts(ev.target.checked)}
          checked={includeAccounts}
          disabled={disabled}
        >
          Push accounts
        </LabelToggle>

        {/* Push button */}
        <PrimaryButton onClick={pushWallets} disabled={disabled}>
          <MdCloudUpload className="size-4" />
          {mutation.isPending
            ? "Pushing..."
            : includeAccounts
              ? "Push all Wallets"
              : "Push Master Wallet"}
        </PrimaryButton>
      </AutoStickyContainer>

      <AutoWalletsPushResult data={mutation.data} error={mutation.error} />

      {/* Accounts Chooser */}
      {includeAccounts ? (
        <AutoAccountsChooser {...selector} disabled={disabled} />
      ) : null}
    </div>
  );
}
