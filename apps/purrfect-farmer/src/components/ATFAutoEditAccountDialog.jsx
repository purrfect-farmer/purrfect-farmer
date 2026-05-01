import { MdDelete, MdHourglassEmpty } from "react-icons/md";
import { useEffect, useState } from "react";

import ATFAutoAccountForm from "./ATFAutoAccountForm";
import Alert from "./Alert";
import Button from "./Button";
import CenteredDialog from "./CenteredDialog";
import { TbUserEdit } from "react-icons/tb";
import { encryption } from "@/services/encryption";
import { getWalletAddressFromMnemonic } from "@purrfect/shared/lib/atf-auto";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";

export default function ATFAutoEditAccountDialog({
  account,
  onSave,
  onDelete,
}) {
  const { password } = useATFAuto();
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    if (!account || !password) return;
    encryption
      .decryptData({
        ...account.encryptedPhrase,
        password,
        asText: true,
      })
      .then(setPhrase);
  }, [account, password]);

  const handleFormSubmit = async (data) => {
    const encryptedPhrase = await encryption.encryptData({
      data: data.phrase,
      password,
    });

    const address = await getWalletAddressFromMnemonic(
      data.phrase,
      data.version,
    );

    onSave({
      ...account,
      title: data.title,
      version: data.version,
      userId: data.userId,
      address,
      encryptedPhrase,
    });

    toast.success("Account updated!");
  };

  return (
    <CenteredDialog
      icon={TbUserEdit}
      title={"Edit Account"}
      description={"Update account details"}
    >
      {phrase ? (
        <>
          <ATFAutoAccountForm
            initialValues={{
              title: account.title,
              version: account.version,
              userId: account.userId,
              phrase,
            }}
            handleFormSubmit={handleFormSubmit}
            submitLabel="Save Changes"
            submittingLabel="Saving..."
          />

          {/* Divider */}
          <p className="my-1 text-neutral-400 text-center">OR</p>
          <Alert variant={"danger"}>
            This action cannot be undone. This will permanently delete the
            account and all associated data.
          </Alert>
          <Button variant={"danger"} onClick={onDelete}>
            <MdDelete className="size-4" />
            Delete Account
          </Button>
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 py-8">
          <MdHourglassEmpty className="size-5 text-neutral-400 animate-spin" />
          <p className="text-neutral-400">Loading account data...</p>
        </div>
      )}
    </CenteredDialog>
  );
}
