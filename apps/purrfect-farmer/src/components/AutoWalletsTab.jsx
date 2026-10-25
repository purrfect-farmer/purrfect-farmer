import { getWalletPushLabel, getWalletPushScope } from "@/lib/autoCloudWallets";

import Alert from "./Alert";
import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoCloudWalletsSummary from "./AutoCloudWalletsSummary";
import AutoStickyContainer from "./AutoStickyContainer";
import AutoWalletsPushResult from "./AutoWalletsPushResult";
import LabelToggle from "./LabelToggle";
import { MdCloudUpload } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudWalletsPushMutation from "@/hooks/useAutoCloudWalletsPushMutation";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";
import { useState } from "react";

export default function AutoWalletsTab() {
  const { accounts, master } = useAuto();
  const { enabled: cloudEnabled } = useCloudQueryOptions();
  const [includeMaster, setIncludeMaster] = useState(true);
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts, selectAccounts } = selector;

  const mutation = useAutoCloudWalletsPushMutation();
  const disabled = !cloudEnabled || mutation.isPending;
  const pushScope = getWalletPushScope(
    includeMaster,
    selectedAccounts.length > 0,
  );

  const pushWallets = () => {
    mutation.mutate({ pushScope, accounts: selectedAccounts });
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <Alert variant="info">
        Stores wallets on the Cloud server, encrypted with its own key. Pushing
        again updates them. Rotation replaces them on its own.
      </Alert>

      {!cloudEnabled ? (
        <Alert variant="warning">Enable the Cloud to push wallets.</Alert>
      ) : (
        <AutoCloudWalletsSummary
          master={master}
          accounts={accounts}
          disabled={disabled}
          selectAccounts={selectAccounts}
        />
      )}

      <AutoStickyContainer className="z-10 gap-2">
        {/* Include master */}
        <LabelToggle
          onChange={(ev) => setIncludeMaster(ev.target.checked)}
          checked={includeMaster}
          disabled={disabled}
        >
          Push master
        </LabelToggle>

        {/* Push button */}
        <PrimaryButton onClick={pushWallets} disabled={disabled || !pushScope}>
          <MdCloudUpload className="size-4" />
          {mutation.isPending ? "Pushing..." : getWalletPushLabel(pushScope)}
        </PrimaryButton>
      </AutoStickyContainer>

      <AutoWalletsPushResult data={mutation.data} error={mutation.error} />

      {/* Accounts Chooser */}
      <AutoAccountsChooser {...selector} disabled={disabled} />
    </div>
  );
}
