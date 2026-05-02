import Alert from "./Alert";
import CenteredDialog from "./CenteredDialog";
import { FaUserNinja } from "react-icons/fa6";
import LabelToggle from "./LabelToggle";
import { LiaUserNinjaSolid } from "react-icons/lia";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFWalletsRotationMutation from "@/hooks/useATFWalletsRotationMutation";
import { useState } from "react";
import { yup } from "@/lib/yup";

/** Schema */
const schema = yup
  .object({
    ["address"]: yup.string().trim().required().label("Address"),
  })
  .required();

export default function ATFAutoRotationDialog() {
  const { master } = useATFAuto();
  const [transferFunds, setTransferFunds] = useState(true);
  const [includeAccounts, setIncludeAccounts] = useState(true);

  const mutation = useATFWalletsRotationMutation();

  const rotateWallets = () => {
    if (!master) return;
    toast.promise(mutation.mutateAsync({ transferFunds, includeAccounts }), {
      loading: "Rotating wallets...",
      success: "Wallets rotated successfully!",
      error: "Failed to rotate wallets.",
    });
  };

  return (
    <CenteredDialog
      icon={LiaUserNinjaSolid}
      title={"Rotate Wallets"}
      description={"Change wallet of master / accounts"}
    >
      {/* Warning */}
      <Alert variant={"danger"}>
        You are about to rotate the master wallet.
        <br />
        <strong className="font-bold">Note:</strong> Only toggle the buttons
        below if you do not wish to transfer funds or rotate the wallet of each
        account.
      </Alert>

      {/* Transfer funds */}
      <LabelToggle
        onChange={(ev) => setTransferFunds(ev.target.checked)}
        checked={transferFunds}
        disabled={mutation.isPending}
      >
        Transfer funds
      </LabelToggle>

      {/* Include accounts */}
      <LabelToggle
        onChange={(ev) => setIncludeAccounts(ev.target.checked)}
        checked={includeAccounts}
        disabled={mutation.isPending}
      >
        Rotate accounts
      </LabelToggle>

      {/* Rotate button */}
      <PrimaryButton onClick={rotateWallets} disabled={mutation.isPending}>
        <FaUserNinja className="size-4" />{" "}
        {mutation.isPending
          ? "Rotating..."
          : includeAccounts
            ? "Rotate all Wallets"
            : "Rotate Master Wallet"}
      </PrimaryButton>
    </CenteredDialog>
  );
}
