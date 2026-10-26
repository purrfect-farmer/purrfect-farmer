import { AUTO_ACTION_DIALOG } from "@/constants/autoActionDialog";
import { IMPORT_TAB } from "@/constants/autoImportTab";
import useAuto from "./useAuto";
import { useCallback, useEffect, useState } from "react";

/** A hook for the Auto dashboard's dialogs, of which one is open at a time */
export default function useAutoActionDialogs() {
  const { pendingWhiskersPick } = useAuto();

  /** The open dialog, or null */
  const [openDialog, setOpenDialog] = useState(null);

  /** The tab the import dialog opens on */
  const [importTab, setImportTab] = useState(IMPORT_TAB.IMPORT);

  /** The opener of a dialog, closing any other */
  const open = useCallback((dialog) => setOpenDialog(dialog), []);

  /** The closer of the open dialog, which also resets the import tab */
  const close = useCallback(() => {
    setOpenDialog(null);
    setImportTab(IMPORT_TAB.IMPORT);
  }, []);

  /** The `onOpenChange` of a dialog */
  const openChangeOf = useCallback(
    (dialog) => (isOpen) => (isOpen ? open(dialog) : close()),
    [open, close],
  );

  /** Opens the Whiskers import right after a master setup that asked for it */
  useEffect(() => {
    if (!pendingWhiskersPick) return;

    setImportTab(IMPORT_TAB.WHISKERS);
    setOpenDialog(AUTO_ACTION_DIALOG.IMPORT);
  }, [pendingWhiskersPick]);

  return { openDialog, importTab, open, close, openChangeOf };
}
