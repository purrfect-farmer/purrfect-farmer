import { useEffect, useState } from "react";

import ATFAutoAccountForm from "./ATFAutoAccountForm";
import CenteredDialog from "./CenteredDialog";
import Input from "./Input";
import { MdHourglassEmpty } from "react-icons/md";
import { encryption } from "@/services/encryption";
import { getWalletAddressFromMnemonic } from "@/lib/atf-auto";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useAppContext from "@/hooks/useAppContext";

export default function ATFAutoMasterEditDialog({ onSave }) {
  const { master, password, dispatchAndStoreMaster } = useATFAuto();
  const { openTelegramLink } = useAppContext();
  const [phrase, setPhrase] = useState("");
  const [tonCenterApiKey, setToncenterApiKey] = useState(
    master?.tonCenterApiKey || "",
  );

  useEffect(() => {
    if (!master || !password) return;
    encryption
      .decryptData({
        ...master.encryptedWalletPhrase,
        password,
        asText: true,
      })
      .then(setPhrase);
  }, [master, password]);

  const handleFormSubmit = async (data) => {
    const encryptedWalletPhrase = await encryption.encryptData({
      data: data.phrase,
      password,
    });

    const address = await getWalletAddressFromMnemonic(
      data.phrase,
      data.version,
    );

    dispatchAndStoreMaster({
      ...master,
      address,
      version: data.version,
      encryptedWalletPhrase,
      tonCenterApiKey,
    });

    toast.success("Master account updated!");

    onSave?.();
  };

  return (
    <CenteredDialog
      title={"Edit Master Account"}
      description={"Update master wallet details"}
    >
      {phrase ? (
        <>
          {/* Toncenter API Key */}
          <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            Toncenter API Key
          </label>
          <Input
            value={tonCenterApiKey}
            onChange={(e) => setToncenterApiKey(e.target.value)}
            autoComplete="off"
            placeholder="Toncenter API Key"
          />
          <button
            type="button"
            onClick={() => openTelegramLink("https://t.me/toncenter")}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Get API key from @toncenter
          </button>

          <ATFAutoAccountForm
            initialValues={{
              phrase,
              version: master.version,
            }}
            handleFormSubmit={handleFormSubmit}
            submitLabel="Save Changes"
            submittingLabel="Saving..."
            hideTitle
          />
        </>
      ) : (
        <p className="flex items-center justify-center gap-2 py-8 text-neutral-500 dark:text-neutral-400">
          <MdHourglassEmpty className="size-5 animate-spin" />
          Loading master data...
        </p>
      )}
    </CenteredDialog>
  );
}
