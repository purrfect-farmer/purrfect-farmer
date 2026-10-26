import {
  AutoMasterCardButton,
  AutoMasterCardButtonRow,
} from "./AutoMasterCardButton";
import { MdCancel, MdCheckCircle, MdCloudUpload } from "react-icons/md";
import { LuArrowDownUp, LuMerge, LuRefreshCw } from "react-icons/lu";

import { AUTO_ACTION_DIALOG } from "@/constants/autoActionDialog";
import BottomDialog from "./BottomDialog";
import Container from "./Container";
import { Dialog } from "radix-ui";
import { HiCog6Tooth } from "react-icons/hi2";
import { LiaUserNinjaSolid } from "react-icons/lia";
import { PiBroom } from "react-icons/pi";
import { cn } from "@/utils";

/** A titled group of actions in the sheet */
function ActionsSection({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h3
        className={cn(
          "text-xs font-bold uppercase tracking-wide",
          "text-neutral-500 dark:text-neutral-400",
        )}
      >
        {title}
      </h3>
      <AutoMasterCardButtonRow className="justify-start">
        {children}
      </AutoMasterCardButtonRow>
    </section>
  );
}

/** A sheet with the Auto dashboard's less frequent actions, grouped by what they act on */
export default function AutoMoreActionsSheet({
  actions,
  onOpenDialog,
  onClose,
}) {
  /** The handler for a one-tap action, which closes the sheet */
  const runAndClose = (action) => () => {
    onClose();
    action.run();
  };

  return (
    <BottomDialog.Container
      onOpenAutoFocus={(ev) => ev.preventDefault()}
      className="h-auto max-h-[85dvh]"
    >
      <div className="min-h-0 overflow-auto grow">
        <Container className="flex flex-col gap-4 p-4">
          <Dialog.Title className="font-bold text-center">
            More actions
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Cloud requests and account tools
          </Dialog.Description>

          {/* Cloud */}
          <ActionsSection title="Cloud">
            <AutoMasterCardButton
              title="Collect accounts in Cloud"
              icon={LuMerge}
              onClick={runAndClose(actions.collect)}
              disabled={actions.collect.isPending}
            >
              Collect
            </AutoMasterCardButton>
            <AutoMasterCardButton
              title="Get accounts status"
              icon={MdCheckCircle}
              onClick={runAndClose(actions.status)}
              disabled={actions.status.isPending}
            >
              Status
            </AutoMasterCardButton>
            <AutoMasterCardButton
              title="Cancel Cloud Operation"
              icon={MdCancel}
              tone="danger"
              onClick={runAndClose(actions.cancel)}
              disabled={actions.cancel.isPending}
            >
              Cancel
            </AutoMasterCardButton>
          </ActionsSection>

          {/* Accounts */}
          <ActionsSection title="Accounts">
            <AutoMasterCardButton
              title="Sweep inactive accounts"
              icon={PiBroom}
              onClick={runAndClose(actions.sweep)}
              disabled={actions.sweep.isPending}
            >
              Sweep
            </AutoMasterCardButton>
            <AutoMasterCardButton
              title="Rotate Wallets"
              icon={LiaUserNinjaSolid}
              onClick={() => onOpenDialog(AUTO_ACTION_DIALOG.ROTATE)}
            >
              Rotate
            </AutoMasterCardButton>
            <AutoMasterCardButton
              title="Push wallets to Cloud"
              icon={MdCloudUpload}
              onClick={() => onOpenDialog(AUTO_ACTION_DIALOG.PUSH)}
            >
              Push
            </AutoMasterCardButton>
            {import.meta.env.VITE_WHISKER && (
              <AutoMasterCardButton
                title="Resync names from Whiskers"
                icon={LuRefreshCw}
                onClick={runAndClose(actions.resync)}
                disabled={actions.resync.isPending}
              >
                Resync
              </AutoMasterCardButton>
            )}
            <AutoMasterCardButton
              title="Import / Export wallets"
              icon={LuArrowDownUp}
              onClick={() => onOpenDialog(AUTO_ACTION_DIALOG.IMPORT)}
            >
              Import
            </AutoMasterCardButton>
            <AutoMasterCardButton
              title="Settings"
              icon={HiCog6Tooth}
              onClick={() => onOpenDialog(AUTO_ACTION_DIALOG.SETTINGS)}
            >
              Settings
            </AutoMasterCardButton>
          </ActionsSection>
        </Container>
      </div>

      <Container className="flex flex-col p-4 pt-0 font-bold shrink-0">
        <Dialog.Close className="p-2.5 text-white bg-blue-500 rounded-lg">
          Close
        </Dialog.Close>
      </Container>
    </BottomDialog.Container>
  );
}
