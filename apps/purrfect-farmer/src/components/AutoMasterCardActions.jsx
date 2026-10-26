import {
  LiaDollarSignSolid,
  LiaFireAltSolid,
  LiaUserNinjaSolid,
} from "react-icons/lia";
import {
  MdCancel,
  MdCheckCircle,
  MdCloudUpload,
  MdOutlineDoubleArrow,
} from "react-icons/md";

import { AutoMasterCardButton } from "./AutoMasterCardButton";
import AutoImportExportDialog, { IMPORT_TAB } from "./AutoImportExportDialog";
import AutoRotationDialog from "./AutoRotationDialog";
import AutoWalletsPushDialog from "./AutoWalletsPushDialog";
import AutoSendDialog from "./AutoSendDialog";
import AutoSettingsDialog from "./AutoSettingsDialog";
import AutoTransferDialog from "./AutoTransferDialog";
import { Dialog } from "radix-ui";
import { HiCog6Tooth } from "react-icons/hi2";
import { LuArrowDownUp, LuMerge, LuRefreshCw, LuSend } from "react-icons/lu";
import { PiBroom } from "react-icons/pi";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoCloudBoostMutation from "@/hooks/useAutoCloudBoostMutation";
import useAutoCloudCancellationMutation from "@/hooks/useAutoCloudCancellationMutation";
import useAutoCloudCollectionMutation from "@/hooks/useAutoCloudCollectionMutation";
import useAutoCloudStatusMutation from "@/hooks/useAutoCloudStatusMutation";
import useAutoCloudWithdrawalMutation from "@/hooks/useAutoCloudWithdrawalMutation";
import useAutoSweepMutation from "@/hooks/useAutoSweepMutation";
import useAutoWhiskersResyncMutation from "@/hooks/useAutoWhiskersResyncMutation";
import { useEffect, useState } from "react";

function ActionsGroup(props) {
  return (
    <div
      {...props}
      className={cn(
        "flex justify-center items-center flex-wrap gap-2",
        props.className,
      )}
    />
  );
}

export function AutoMasterCardActions() {
  const { password, master, accounts, pendingWhiskersPick } = useAuto();
  const [importOpen, setImportOpen] = useState(false);

  /** The tab the import dialog opens on */
  const [importTab, setImportTab] = useState(IMPORT_TAB.IMPORT);

  const boostMutation = useAutoCloudBoostMutation();
  const withdrawMutation = useAutoCloudWithdrawalMutation();
  const collectMutation = useAutoCloudCollectionMutation();
  const cancellationMutation = useAutoCloudCancellationMutation();
  const statusMutation = useAutoCloudStatusMutation();
  const sweepMutation = useAutoSweepMutation();
  const resyncMutation = useAutoWhiskersResyncMutation();

  /** Opens the Whiskers import right after a master setup that asked for it */
  useEffect(() => {
    if (!pendingWhiskersPick) return;

    setImportTab(IMPORT_TAB.WHISKERS);
    setImportOpen(true);
  }, [pendingWhiskersPick]);

  /** The handler for opening or closing the import dialog, which reopens on its first tab */
  const handleImportOpenChange = (open) => {
    setImportOpen(open);

    if (!open) setImportTab(IMPORT_TAB.IMPORT);
  };

  const boostWithCloud = () => {
    toast.promise(
      boostMutation.mutateAsync({
        password,
        master,
        accounts,
      }),
      {
        loading: "Dispatching...",
        success: "Dispatched",
        error: "Failed to dispatch boost request",
      },
    );
  };

  const withdrawWithCloud = () => {
    toast.promise(
      withdrawMutation.mutateAsync({
        password,
        master,
        accounts,
      }),
      {
        loading: "Dispatching...",
        success: "Dispatched",
        error: "Failed to dispatch withdrawal request",
      },
    );
  };

  const collectWithCloud = () => {
    toast.promise(
      collectMutation.mutateAsync({
        password,
        master,
        accounts,
      }),
      {
        loading: "Dispatching...",
        success: "Dispatched",
        error: "Failed to dispatch collection request",
      },
    );
  };

  const requestStatusWithCloud = () => {
    toast.promise(
      statusMutation.mutateAsync({
        password,
        master,
        accounts,
      }),
      {
        loading: "Dispatching...",
        success: "Dispatched",
        error: "Failed to dispatch status request",
      },
    );
  };

  const cancelCloudOperation = () => {
    toast.promise(cancellationMutation.mutateAsync(), {
      loading: "Dispatching...",
      success: "Dispatched",
      error: "Failed to dispatch cancellation request",
    });
  };

  const resyncNamesFromWhiskers = () => {
    toast.promise(resyncMutation.mutateAsync(), {
      loading: "Resyncing...",
      success: ({ updated, missing }) =>
        `Renamed ${updated} account(s)` +
        (missing ? `, ${missing} not in Whiskers` : "") +
        ".",
      error: (error) => error.message,
    });
  };

  const sweepInactiveAccounts = () => {
    toast.promise(sweepMutation.mutateAsync(), {
      loading: "Sweeping...",
      success: "Swept inactive accounts!",
      error: "Failed to sweep accounts!",
    });
  };

  return (
    <>
      {/* Cloud operations */}
      <ActionsGroup>
        {/* Boost */}
        <AutoMasterCardButton
          title={"Boost accounts in Cloud"}
          icon={LiaFireAltSolid}
          onClick={boostWithCloud}
          disabled={boostMutation.isPending}
        >
          {boostMutation.isPending ? "Requesting..." : "Boost"}
        </AutoMasterCardButton>

        {/* Withdraw */}
        <AutoMasterCardButton
          title={"Withdraw accounts in Cloud"}
          icon={LiaDollarSignSolid}
          onClick={withdrawWithCloud}
          disabled={withdrawMutation.isPending}
        >
          {withdrawMutation.isPending ? "Requesting..." : "Withdraw"}
        </AutoMasterCardButton>

        {/* Collect */}
        <AutoMasterCardButton
          title={"Collect accounts in Cloud"}
          icon={LuMerge}
          onClick={collectWithCloud}
          disabled={collectMutation.isPending}
        >
          {collectMutation.isPending ? "Requesting..." : "Collect"}
        </AutoMasterCardButton>

        {/* Status */}
        <AutoMasterCardButton
          title={"Get accounts status"}
          icon={MdCheckCircle}
          onClick={requestStatusWithCloud}
          disabled={statusMutation.isPending}
        >
          {statusMutation.isPending ? "Requesting..." : "Status"}
        </AutoMasterCardButton>
      </ActionsGroup>

      {/* Account operations */}
      <ActionsGroup>
        {/* Sweep */}
        <AutoMasterCardButton
          title={"Sweep inactive accounts"}
          icon={PiBroom}
          onClick={sweepInactiveAccounts}
          disabled={sweepMutation.isPending}
        >
          {sweepMutation.isPending ? "Sweeping..." : "Sweep"}
        </AutoMasterCardButton>

        {/* Rotate */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <AutoMasterCardButton
              title="Rotate Wallets"
              icon={LiaUserNinjaSolid}
            >
              Rotate
            </AutoMasterCardButton>
          </Dialog.Trigger>

          <AutoRotationDialog />
        </Dialog.Root>

        {/* Push */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <AutoMasterCardButton
              title="Push wallets to Cloud"
              icon={MdCloudUpload}
            >
              Push
            </AutoMasterCardButton>
          </Dialog.Trigger>

          <AutoWalletsPushDialog />
        </Dialog.Root>

        {/* Resync names from Whiskers */}
        {import.meta.env.VITE_WHISKER && (
          <AutoMasterCardButton
            type="button"
            title="Resync names from Whiskers"
            icon={LuRefreshCw}
            onClick={resyncNamesFromWhiskers}
            disabled={resyncMutation.isPending}
          >
            {resyncMutation.isPending ? "Syncing..." : "Resync"}
          </AutoMasterCardButton>
        )}

        {/* Import / Export */}
        <Dialog.Root open={importOpen} onOpenChange={handleImportOpenChange}>
          <Dialog.Trigger asChild>
            <AutoMasterCardButton
              title="Import / Export wallets"
              icon={LuArrowDownUp}
            >
              Import
            </AutoMasterCardButton>
          </Dialog.Trigger>

          <AutoImportExportDialog
            defaultTab={importTab}
            onImported={() => handleImportOpenChange(false)}
          />
        </Dialog.Root>

        {/* Settings */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <AutoMasterCardButton title="Settings" icon={HiCog6Tooth}>
              Settings
            </AutoMasterCardButton>
          </Dialog.Trigger>

          <AutoSettingsDialog />
        </Dialog.Root>
      </ActionsGroup>

      {/* Wallet operations */}
      <ActionsGroup>
        {/* Send Button */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <AutoMasterCardButton title="Send tokens" icon={LuSend}>
              Send
            </AutoMasterCardButton>
          </Dialog.Trigger>

          <AutoSendDialog />
        </Dialog.Root>

        {/* Transfer Button */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <AutoMasterCardButton
              title="Transfer funds from Master"
              icon={MdOutlineDoubleArrow}
            >
              Transfer
            </AutoMasterCardButton>
          </Dialog.Trigger>

          <AutoTransferDialog />
        </Dialog.Root>
      </ActionsGroup>

      <ActionsGroup>
        {/* Cancel */}
        <AutoMasterCardButton
          title={"Cancel Cloud Operation"}
          icon={MdCancel}
          onClick={cancelCloudOperation}
          disabled={cancellationMutation.isPending}
        >
          {cancellationMutation.isPending ? "Requesting..." : "Cancel"}
        </AutoMasterCardButton>
      </ActionsGroup>
    </>
  );
}
