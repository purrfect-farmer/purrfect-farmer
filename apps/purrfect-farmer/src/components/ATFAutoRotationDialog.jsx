import Alert from "./Alert";
import CenteredDialog from "./CenteredDialog";
import { FaUserNinja } from "react-icons/fa6";
import LabelToggle from "./LabelToggle";
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
  const [includeAccounts, setIncludeAccounts] = useState(false);

  const mutation = useATFWalletsRotationMutation();

  const rotateWallets = () => {
    if (!master) return;
    toast.promise(mutation.mutateAsync({ includeAccounts }), {
      loading: "Rotating wallets...",
      success: "Wallets rotated successfully!",
      error: "Failed to rotate wallets.",
    });
  };

  return (
    <CenteredDialog
      title={"Rotate Wallets"}
      description={"Change wallet of master / accounts"}
    >
      {/* Warning */}
      <Alert variant={"warning"}>
        You are about to rotate the master wallet. Toggle the button below to
        also rotate the wallet of each account.
      </Alert>

      {/* Include accounts */}
      <LabelToggle
        onChange={(ev) => setIncludeAccounts(ev.target.checked)}
        checked={includeAccounts}
        disabled={mutation.isPending}
      >
        Include accounts
      </LabelToggle>

      {/* Rotate button */}
      <PrimaryButton onClick={rotateWallets} disabled={mutation.isPending}>
        <FaUserNinja className="size-4" />{" "}
        {mutation.isPending ? "Rotating..." : "Rotate"}
      </PrimaryButton>
    </CenteredDialog>
  );
}
