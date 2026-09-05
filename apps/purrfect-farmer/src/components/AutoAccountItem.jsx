import { MdEditNote, MdInfo } from "react-icons/md";
import { Reorder, useDragControls } from "motion/react";
import { memo, useState } from "react";

import AutoAccountBalance from "./AutoAccountBalance";
import AutoAccountBoosterDialog from "./AutoAccountBoosterDialog";
import AutoAccountDetailsDialog from "./AutoAccountDetailsDialog";
import AutoAddress from "./AutoAddress";
import AutoAvatar from "./AutoAvatar";
import AutoEditAccountDialog from "./AutoEditAccountDialog";
import AutoVerifiedBadge from "./AutoVerifiedBadge";
import AutoVersionBadge from "./AutoVersionBadge";
import { Dialog } from "radix-ui";
import { cn } from "@/utils";

const ActionButton = (props) => (
  <button
    {...props}
    className={cn(
      "text-neutral-500 dark:text-neutral-400",
      "hover:bg-neutral-300 dark:hover:bg-neutral-500",
      "hover:text-black dark:hover:text-white",
      "p-1.5 rounded-lg shrink-0",
      "transition-colors",
      props.className,
    )}
  />
);

export default memo(function AutoAccountItem({
  account,
  accounts,
  onUpdate,
  onDelete,
}) {
  const dragControls = useDragControls();

  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [boosterOpen, setBoosterOpen] = useState(false);

  const openBooster = () => {
    setBoosterOpen(true);
  };

  return (
    <Reorder.Item
      value={account}
      dragListener={false}
      dragControls={dragControls}
    >
      <div
        className={cn(
          "flex gap-2 items-center",
          "p-1.5 rounded-xl",
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-neutral-200 dark:hover:bg-neutral-600",
          "transition-colors group",
        )}
      >
        {/* Avatar - drag handle */}
        <AutoAvatar
          account={account}
          onPointerDown={(e) => dragControls.start(e)}
        />

        {/* Main content - clickable for booster dialog */}
        <button
          type="button"
          onClick={openBooster}
          className={cn(
            "flex flex-col grow min-w-0 text-left",
            "px-1 py-0.5 cursor-pointer",
          )}
        >
          <div className="flex flex-wrap items-center">
            {/* Title */}
            <h3 className="font-bold truncate w-full grow min-w-0">
              {account.title}
            </h3>
            {/* Address */}
            <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-100">
              <AutoAddress address={account.address} />
              <AutoVersionBadge version={account.version} />
              <AutoVerifiedBadge verified={account.verified} />
            </div>
          </div>

          {/* Balance */}
          <AutoAccountBalance account={account} />
        </button>

        {/* Edit button */}
        <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
          <Dialog.Trigger asChild>
            <ActionButton>
              <MdEditNote className="size-5" />
            </ActionButton>
          </Dialog.Trigger>
          <AutoEditAccountDialog
            account={account}
            onSave={(updated) => {
              onUpdate(updated);
              setEditOpen(false);
            }}
            onDelete={() => {
              onDelete(account.id);
              setEditOpen(false);
            }}
          />
        </Dialog.Root>

        {/* Details button */}
        <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
          <Dialog.Trigger asChild>
            <ActionButton>
              <MdInfo className="size-5" />
            </ActionButton>
          </Dialog.Trigger>
          <AutoAccountDetailsDialog account={account} />
        </Dialog.Root>

        {/* Booster dialog */}
        <Dialog.Root open={boosterOpen} onOpenChange={setBoosterOpen}>
          <AutoAccountBoosterDialog account={account} />
        </Dialog.Root>
      </div>
    </Reorder.Item>
  );
});
