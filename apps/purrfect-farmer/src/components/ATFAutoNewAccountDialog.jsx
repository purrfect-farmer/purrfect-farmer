import ATFAutoAccountForm from "./ATFAutoAccountForm";
import CenteredDialog from "./CenteredDialog";
import { encryption } from "@/services/encryption";
import { getWalletAddressFromMnemonic } from "@/lib/atf-auto";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import { uuid } from "@/utils";

export default function ATFAutoNewAccountDialog({ onCreated }) {
  const { password, dispatchAndStoreAccounts, accounts } = useATFAuto();

  const handleFormSubmit = async (data) => {
    const encryptedPhrase = await encryption.encryptData({
      data: data.phrase,
      password,
    });

    const address = await getWalletAddressFromMnemonic(
      data.phrase,
      data.version,
    );

    const account = {
      id: uuid(),
      title: data.title,
      address,
      version: data.version,
      encryptedPhrase,
    };

    dispatchAndStoreAccounts([...accounts, account]);
    toast.success("Account added!");
    onCreated?.();
  };

  return (
    <CenteredDialog
      title={"Add Account"}
      description={"Add a new wallet account"}
    >
      <ATFAutoAccountForm
        handleFormSubmit={handleFormSubmit}
        submitLabel="Add Account"
        submittingLabel="Adding..."
      />
    </CenteredDialog>
  );
}
