import AutoAccountsChooser from "./AutoAccountsChooser";
import Alert from "./Alert";
import LabelToggle from "./LabelToggle";
import { LuUpload } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import { createBundle } from "@/lib/autoTransfer";
import { downloadFile } from "@/utils";
import { formatDate } from "date-fns";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import { useState } from "react";

/**
 * Writes this drop's wallets out as a bundle file.
 *
 * Phrases leave as the stored encrypted blobs, so the file is only usable by
 * someone who also knows this drop's password.
 */
export default function AutoExportForm() {
  const { config, master, accounts } = useAuto();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const [includeMaster, setIncludeMaster] = useState(true);

  const handleExport = () => {
    const bundle = createBundle({
      config,
      master: includeMaster ? master : null,
      accounts: selectedAccounts,
    });

    downloadFile(
      `${config.id}-export-${formatDate(new Date(), "yyyyMMdd-HHmmss")}.json`,
      bundle,
    );

    toast.success("Export downloaded!");
  };

  return (
    <div className="flex flex-col gap-2">
      <Alert variant="info">
        Wallet phrases stay encrypted in the file — importing it needs{" "}
        {config.title}'s current password. The Toncenter API key is not
        encrypted.
      </Alert>

      <LabelToggle
        checked={includeMaster}
        onChange={(ev) => setIncludeMaster(ev.target.checked)}
      >
        Include master wallet
      </LabelToggle>

      <div className="max-h-72 overflow-auto">
        <AutoAccountsChooser
          {...selector}
          showBalance={false}
          autoFocusSearch={false}
        />
      </div>

      <PrimaryButton
        type="button"
        onClick={handleExport}
        disabled={!selectedAccounts.length && !includeMaster}
      >
        <LuUpload className="size-4" />
        Export
      </PrimaryButton>
    </div>
  );
}
