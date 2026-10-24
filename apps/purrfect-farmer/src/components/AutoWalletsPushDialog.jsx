import { getWalletPushLabel, getWalletPushScope } from "@/lib/autoCloudWallets";

import Alert from "./Alert";
import AutoWalletsPushResult from "./AutoWalletsPushResult";
import CenteredDialog from "./CenteredDialog";
import LabelToggle from "./LabelToggle";
import { MdCloudUpload } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import useAuto from "@/hooks/useAuto";
import useAutoCloudWalletsPushMutation from "@/hooks/useAutoCloudWalletsPushMutation";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";
import { useState } from "react";

export default function AutoWalletsPushDialog() {
  const { accounts } = useAuto();
  const { enabled: cloudEnabled } = useCloudQueryOptions();
  const [includeMaster, setIncludeMaster] = useState(true);
  const [includeAccounts, setIncludeAccounts] = useState(true);

  const mutation = useAutoCloudWalletsPushMutation();
  const disabled = !cloudEnabled || mutation.isPending;
  const pushScope = getWalletPushScope(
    includeMaster,
    includeAccounts && accounts.length > 0,
  );

  const pushWallets = () => {
    mutation.mutate({ pushScope, accounts: includeAccounts ? accounts : [] });
  };

  return (
    <CenteredDialog
      icon={MdCloudUpload}
      title={"Push Wallets"}
      description={"Store master / account wallets on the Cloud server"}
    >
      <Alert variant={"info"}>
        Stores wallets on the Cloud server, encrypted with its own key. Use the
        Wallets tab to push only some accounts.
      </Alert>

      {!cloudEnabled ? (
        <Alert variant="warning">Enable the Cloud to push wallets.</Alert>
      ) : null}

      {/* Include master */}
      <LabelToggle
        onChange={(ev) => setIncludeMaster(ev.target.checked)}
        checked={includeMaster}
        disabled={disabled}
      >
        Push master
      </LabelToggle>

      {/* Include accounts */}
      <LabelToggle
        onChange={(ev) => setIncludeAccounts(ev.target.checked)}
        checked={includeAccounts}
        disabled={disabled}
      >
        Push accounts
      </LabelToggle>

      <AutoWalletsPushResult data={mutation.data} error={mutation.error} />

      {/* Push button */}
      <PrimaryButton onClick={pushWallets} disabled={disabled || !pushScope}>
        <MdCloudUpload className="size-4" />
        {mutation.isPending ? "Pushing..." : getWalletPushLabel(pushScope)}
      </PrimaryButton>
    </CenteredDialog>
  );
}
