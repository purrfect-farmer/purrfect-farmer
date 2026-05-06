import {
  LiaDollarSignSolid,
  LiaFireAltSolid,
  LiaUserNinjaSolid,
} from "react-icons/lia";
import { MdCancel, MdCheckCircle, MdOutlineDoubleArrow } from "react-icons/md";

import { ATFAutoMasterCardButton } from "./ATFAutoMasterCardButton";
import ATFAutoRotationDialog from "./ATFAutoRotationDialog";
import ATFAutoSettingsDialog from "./ATFAutoSettingsDialog";
import ATFAutoTransferDialog from "./ATFAutoTransferDialog";
import { Dialog } from "radix-ui";
import { HiCog6Tooth } from "react-icons/hi2";
import { LuMerge } from "react-icons/lu";
import { PiBroom } from "react-icons/pi";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoCloudBoostMutation from "@/hooks/useATFAutoCloudBoostMutation";
import useATFAutoCloudCancellationMutation from "@/hooks/useATFAutoCloudCancellationMutation";
import useATFAutoCloudCollectionMutation from "@/hooks/useATFAutoCloudCollectionMutation";
import useATFAutoCloudStatusMutation from "@/hooks/useATFAutoCloudStatusMutation";
import useATFAutoCloudWithdrawalMutation from "@/hooks/useATFAutoCloudWithdrawalMutation";
import useATFAutoSweepMutation from "@/hooks/useATFAutoSweepMutation";

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

export function ATFAutoMasterCardActions() {
  const { password, master, accounts } = useATFAuto();

  const boostMutation = useATFAutoCloudBoostMutation();
  const withdrawMutation = useATFAutoCloudWithdrawalMutation();
  const collectMutation = useATFAutoCloudCollectionMutation();
  const cancellationMutation = useATFAutoCloudCancellationMutation();
  const statusMutation = useATFAutoCloudStatusMutation();
  const sweepMutation = useATFAutoSweepMutation();

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
        <ATFAutoMasterCardButton
          title={"Boost accounts in Cloud"}
          icon={LiaFireAltSolid}
          onClick={boostWithCloud}
          disabled={boostMutation.isPending}
        >
          {boostMutation.isPending ? "Requesting..." : "Boost"}
        </ATFAutoMasterCardButton>

        {/* Withdraw */}
        <ATFAutoMasterCardButton
          title={"Withdraw accounts in Cloud"}
          icon={LiaDollarSignSolid}
          onClick={withdrawWithCloud}
          disabled={withdrawMutation.isPending}
        >
          {withdrawMutation.isPending ? "Requesting..." : "Withdraw"}
        </ATFAutoMasterCardButton>

        {/* Collect */}
        <ATFAutoMasterCardButton
          title={"Collect accounts in Cloud"}
          icon={LuMerge}
          onClick={collectWithCloud}
          disabled={collectMutation.isPending}
        >
          {collectMutation.isPending ? "Requesting..." : "Collect"}
        </ATFAutoMasterCardButton>

        {/* Status */}
        <ATFAutoMasterCardButton
          title={"Get accounts status"}
          icon={MdCheckCircle}
          onClick={requestStatusWithCloud}
          disabled={statusMutation.isPending}
        >
          {statusMutation.isPending ? "Requesting..." : "Status"}
        </ATFAutoMasterCardButton>
      </ActionsGroup>

      {/* Account operations */}
      <ActionsGroup>
        {/* Sweep */}
        <ATFAutoMasterCardButton
          title={"Sweep inactive accounts"}
          icon={PiBroom}
          onClick={sweepInactiveAccounts}
          disabled={sweepMutation.isPending}
        >
          {sweepMutation.isPending ? "Sweeping..." : "Sweep"}
        </ATFAutoMasterCardButton>

        {/* Rotate */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <ATFAutoMasterCardButton
              title="Rotate Wallets"
              icon={LiaUserNinjaSolid}
            >
              Rotate
            </ATFAutoMasterCardButton>
          </Dialog.Trigger>

          <ATFAutoRotationDialog />
        </Dialog.Root>

        {/* Transfer Button */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <ATFAutoMasterCardButton
              title="Transfer funds from Master"
              icon={MdOutlineDoubleArrow}
            >
              Transfer
            </ATFAutoMasterCardButton>
          </Dialog.Trigger>

          <ATFAutoTransferDialog />
        </Dialog.Root>

        {/* Rotate */}
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <ATFAutoMasterCardButton title="Settings" icon={HiCog6Tooth}>
              Settings
            </ATFAutoMasterCardButton>
          </Dialog.Trigger>

          <ATFAutoSettingsDialog />
        </Dialog.Root>
      </ActionsGroup>

      <ActionsGroup>
        {/* Cancel */}
        <ATFAutoMasterCardButton
          title={"Cancel Cloud Operation"}
          icon={MdCancel}
          onClick={cancelCloudOperation}
          disabled={cancellationMutation.isPending}
        >
          {cancellationMutation.isPending ? "Requesting..." : "Cancel"}
        </ATFAutoMasterCardButton>
      </ActionsGroup>
    </>
  );
}
