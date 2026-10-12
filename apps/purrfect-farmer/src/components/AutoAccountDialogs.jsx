import { useCallback, useMemo, useState } from "react";

import AutoAccountBoosterDialog from "./AutoAccountBoosterDialog";
import AutoAccountDetailsDialog from "./AutoAccountDetailsDialog";
import AutoAccountDialogActionsContext from "@/contexts/AutoAccountDialogActionsContext";
import AutoAccountDialogContext from "@/contexts/AutoAccountDialogContext";
import AutoEditAccountDialog from "./AutoEditAccountDialog";
import { Dialog } from "radix-ui";

/** One open account dialog for the whole list, so any of them can step to another account */
export default function AutoAccountDialogs({
  accounts,
  onUpdate,
  onDelete,
  children,
}) {
  const [dialog, setDialog] = useState(null);

  /** Looked up fresh so the dialog follows account updates and the visible order */
  const account = useMemo(
    () => (dialog ? accounts.find((item) => item.id === dialog.id) : null),
    [accounts, dialog],
  );

  const openDialog = useCallback((type, id) => setDialog({ type, id }), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const switchAccount = useCallback(
    (id) => setDialog((prev) => (prev ? { ...prev, id } : prev)),
    [],
  );

  /** Stable, so rows that only open dialogs skip re-rendering on every switch */
  const actions = useMemo(
    () => ({ openDialog, switchAccount, closeDialog }),
    [openDialog, switchAccount, closeDialog],
  );

  const value = useMemo(
    () => ({ accounts, dialog, ...actions }),
    [accounts, dialog, actions],
  );

  const handleOpenChange = useCallback(
    (open) => !open && closeDialog(),
    [closeDialog],
  );

  const handleSave = useCallback(
    (updated) => {
      onUpdate(updated);
      closeDialog();
    },
    [onUpdate, closeDialog],
  );

  const handleDelete = useCallback(() => {
    onDelete(dialog?.id);
    closeDialog();
  }, [onDelete, dialog?.id, closeDialog]);

  return (
    <AutoAccountDialogActionsContext.Provider value={actions}>
      <AutoAccountDialogContext.Provider value={value}>
        {children}

        <Dialog.Root open={Boolean(account)} onOpenChange={handleOpenChange}>
          {account && dialog.type === "booster" && (
            <AutoAccountBoosterDialog account={account} />
          )}

          {account && dialog.type === "details" && (
            <AutoAccountDetailsDialog key={account.id} account={account} />
          )}

          {account && dialog.type === "edit" && (
            <AutoEditAccountDialog
              key={account.id}
              account={account}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </Dialog.Root>
      </AutoAccountDialogContext.Provider>
    </AutoAccountDialogActionsContext.Provider>
  );
}
