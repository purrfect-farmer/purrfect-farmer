import AutoAccountForm from "./AutoAccountForm";
import CenteredDialog from "./CenteredDialog";
import { encryption } from "@/services/encryption";
import { getWalletAddressFromMnemonic } from "@purrfect/shared/lib/ton/wallet";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import { uuid } from "@/utils";

export default function AutoNewAccountDialog({ onCreated }) {
  const { password, storeAccounts, accounts } = useAuto();

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
      version: data.version,
      userId: data.userId,
      verified: Boolean(data.verified),
      encryptedPhrase,
      address,
    };

    storeAccounts([...accounts, account]);
    toast.success("Account added!");
    onCreated?.();
  };

  return (
    <CenteredDialog
      title={"Add Account"}
      description={"Add a new wallet account"}
    >
      <AutoAccountForm
        handleFormSubmit={handleFormSubmit}
        submitLabel="Add Account"
        submittingLabel="Adding..."
      />
    </CenteredDialog>
  );
}
