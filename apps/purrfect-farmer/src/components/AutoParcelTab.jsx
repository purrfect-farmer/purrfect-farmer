import { Dialog } from "radix-ui";

import Alert from "./Alert";
import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoParcelDialog from "./AutoParcelDialog";
import AutoStickyContainer from "./AutoStickyContainer";
import Label from "./Label";
import ParcelIcon from "@/assets/images/parcel-icon.svg";
import PrimaryButton from "./PrimaryButton";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { buildParcelPayload, getParcelToken } from "@/lib/autoParcel";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoMaster from "@/hooks/useAutoMaster";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

/** Token toggle button */
function TokenOption({ active, icon, children, ...props }) {
  return (
    <button
      {...props}
      type="button"
      className={cn(
        "px-4 py-2 rounded-xl font-bold cursor-pointer",
        "flex items-center justify-center gap-2 min-w-0",
        active
          ? "bg-orange-500 text-white"
          : "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      <img src={icon} className="size-5 rounded-full shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}

export default function AutoParcelTab() {
  const { config, accounts } = useAuto();
  const { buildMasterData, decryptPhrase } = useAutoMaster();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;

  const [useNativeTon, setUseNativeTon] = useState(false);
  const [payload, setPayload] = useState(null);

  const mutation = useMutation({
    mutationKey: [config.id, "parcel"],
    mutationFn: async () => {
      /** Decrypt the master wallet */
      const masterData = await buildMasterData();

      /** Decrypt every selected account */
      const decryptedAccounts = [];

      for (const account of selectedAccounts) {
        decryptedAccounts.push({
          address: account.address,
          version: account.version,
          phrase: await decryptPhrase(account.encryptedPhrase),
        });
      }

      return buildParcelPayload({
        masterData,
        accounts: decryptedAccounts,
        token: getParcelToken(config, useNativeTon),
      });
    },
  });

  const handleLaunch = async () => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    const result = await toast.promise(mutation.mutateAsync(), {
      loading: "Preparing wallets...",
      success: "Launching Parcel!",
      error: "Failed to prepare wallets!",
    });

    setPayload(result);
  };

  /** Drop the decrypted phrases once Parcel is closed */
  const handleOpenChange = (open) => {
    if (!open) {
      setPayload(null);
      mutation.reset();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <Alert variant="info">
        Opens Parcel with your master wallet and the selected accounts. Choose
        Split to fund the accounts from master, or Merge to return their tokens
        to master.
      </Alert>

      {/* Token */}
      <div className="flex flex-col gap-1">
        <Label>Token</Label>
        <div className="grid grid-cols-2 gap-2">
          <TokenOption
            active={!useNativeTon}
            icon={config.tokenIcon}
            onClick={() => setUseNativeTon(false)}
          >
            {config.token}
          </TokenOption>
          <TokenOption
            active={useNativeTon}
            icon={TonIcon}
            onClick={() => setUseNativeTon(true)}
          >
            TON
          </TokenOption>
        </div>
      </div>

      {/* Button */}
      <AutoStickyContainer>
        <PrimaryButton disabled={mutation.isPending} onClick={handleLaunch}>
          <img src={ParcelIcon} className="size-4" />{" "}
          {mutation.isPending ? "Preparing..." : "Launch Parcel"}
        </PrimaryButton>
      </AutoStickyContainer>

      {/* Accounts Chooser */}
      <AutoAccountsChooser {...selector} disabled={mutation.isPending} />

      {/* Parcel */}
      <Dialog.Root open={Boolean(payload)} onOpenChange={handleOpenChange}>
        {payload ? <AutoParcelDialog payload={payload} /> : null}
      </Dialog.Root>
    </div>
  );
}
