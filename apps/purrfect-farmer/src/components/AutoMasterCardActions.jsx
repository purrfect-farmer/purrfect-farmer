import {
  AutoMasterCardButton,
  AutoMasterCardButtonRow,
} from "./AutoMasterCardButton";
import { LiaDollarSignSolid, LiaFireAltSolid } from "react-icons/lia";

import { AUTO_ACTION_DIALOG } from "@/constants/autoActionDialog";
import AutoImportExportDialog from "./AutoImportExportDialog";
import AutoMoreActionsSheet from "./AutoMoreActionsSheet";
import AutoRotationDialog from "./AutoRotationDialog";
import AutoSendDialog from "./AutoSendDialog";
import AutoSettingsDialog from "./AutoSettingsDialog";
import AutoTransferDialog from "./AutoTransferDialog";
import AutoWalletsPushDialog from "./AutoWalletsPushDialog";
import { Dialog } from "radix-ui";
import { LuEllipsis, LuSend } from "react-icons/lu";
import { MdOutlineDoubleArrow } from "react-icons/md";
import useAutoActionDialogs from "@/hooks/useAutoActionDialogs";
import useAutoCloudActions from "@/hooks/useAutoCloudActions";

/** The Auto dashboard's actions: the daily ones in a row, the rest in a sheet */
export function AutoMasterCardActions() {
  const actions = useAutoCloudActions();
  const { openDialog, importTab, open, close, openChangeOf } =
    useAutoActionDialogs();

  /** The props of the dialog root that shows `dialog` */
  const rootOf = (dialog) => ({
    open: openDialog === dialog,
    onOpenChange: openChangeOf(dialog),
  });

  return (
    <>
      {/* Daily actions */}
      <AutoMasterCardButtonRow>
        <AutoMasterCardButton
          title="Boost accounts in Cloud"
          icon={LiaFireAltSolid}
          onClick={actions.boost.run}
          disabled={actions.boost.isPending}
        >
          {actions.boost.isPending ? "Requesting..." : "Boost"}
        </AutoMasterCardButton>

        <AutoMasterCardButton
          title="Withdraw accounts in Cloud"
          icon={LiaDollarSignSolid}
          onClick={actions.withdraw.run}
          disabled={actions.withdraw.isPending}
        >
          {actions.withdraw.isPending ? "Requesting..." : "Withdraw"}
        </AutoMasterCardButton>

        <AutoMasterCardButton
          title="Send tokens"
          icon={LuSend}
          onClick={() => open(AUTO_ACTION_DIALOG.SEND)}
        >
          Send
        </AutoMasterCardButton>

        <AutoMasterCardButton
          title="Transfer funds from Master"
          icon={MdOutlineDoubleArrow}
          onClick={() => open(AUTO_ACTION_DIALOG.TRANSFER)}
        >
          Transfer
        </AutoMasterCardButton>

        <AutoMasterCardButton
          title="More actions"
          icon={LuEllipsis}
          aria-haspopup="dialog"
          onClick={() => open(AUTO_ACTION_DIALOG.MORE)}
        >
          More
        </AutoMasterCardButton>
      </AutoMasterCardButtonRow>

      <Dialog.Root {...rootOf(AUTO_ACTION_DIALOG.MORE)}>
        <AutoMoreActionsSheet
          actions={actions}
          onOpenDialog={open}
          onClose={close}
        />
      </Dialog.Root>

      <Dialog.Root {...rootOf(AUTO_ACTION_DIALOG.SEND)}>
        <AutoSendDialog />
      </Dialog.Root>

      <Dialog.Root {...rootOf(AUTO_ACTION_DIALOG.TRANSFER)}>
        <AutoTransferDialog />
      </Dialog.Root>

      <Dialog.Root {...rootOf(AUTO_ACTION_DIALOG.ROTATE)}>
        <AutoRotationDialog />
      </Dialog.Root>

      <Dialog.Root {...rootOf(AUTO_ACTION_DIALOG.PUSH)}>
        <AutoWalletsPushDialog />
      </Dialog.Root>

      <Dialog.Root {...rootOf(AUTO_ACTION_DIALOG.IMPORT)}>
        <AutoImportExportDialog defaultTab={importTab} onImported={close} />
      </Dialog.Root>

      <Dialog.Root {...rootOf(AUTO_ACTION_DIALOG.SETTINGS)}>
        <AutoSettingsDialog />
      </Dialog.Root>
    </>
  );
}
