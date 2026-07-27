import {
  LiaDollarSignSolid,
  LiaFireAltSolid,
  LiaUserNinjaSolid,
} from "react-icons/lia";
import { MdCancel, MdCheckCircle, MdOutlineDoubleArrow } from "react-icons/md";

import { AutoMasterCardButton } from "./AutoMasterCardButton";
import AutoRotationDialog from "./AutoRotationDialog";
import AutoSettingsDialog from "./AutoSettingsDialog";
import AutoTransferDialog from "./AutoTransferDialog";
import { Dialog } from "radix-ui";
import { HiCog6Tooth } from "react-icons/hi2";
import { LuMerge } from "react-icons/lu";
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
  const { password, master, accounts } = useAuto();

  const boostMutation = useAutoCloudBoostMutation();
  const withdrawMutation = useAutoCloudWithdrawalMutation();
  const collectMutation = useAutoCloudCollectionMutation();
  const cancellationMutation = useAutoCloudCancellationMutation();
  const statusMutation = useAutoCloudStatusMutation();
  const sweepMutation = useAutoSweepMutation();

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

        {/* Rotate */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <AutoMasterCardButton title="Settings" icon={HiCog6Tooth}>
              Settings
            </AutoMasterCardButton>
          </Dialog.Trigger>

          <AutoSettingsDialog />
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
