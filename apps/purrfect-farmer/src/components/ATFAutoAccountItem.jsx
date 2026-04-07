import { MdEditNote, MdInfo } from "react-icons/md";
import { Reorder, useDragControls } from "motion/react";
import { memo, useState } from "react";

import ATFAutoAccountBalance from "./ATFAutoAccountBalance";
import ATFAutoAccountDetailsDialog from "./ATFAutoAccountDetailsDialog";
import ATFAutoAccountIframeDialog from "./ATFAutoAccountIframeDialog";
import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoAvatar from "./ATFAutoAvatar";
import ATFAutoEditAccountDialog from "./ATFAutoEditAccountDialog";
import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
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

export default memo(function ATFAutoAccountItem({
  account,
  accounts,
  onUpdate,
  onDelete,
}) {
  const dragControls = useDragControls();

  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [iframeOpen, setIframeOpen] = useState(false);
  const [iframeAccount, setIframeAccount] = useState(account);

  const openIframe = () => {
    setIframeAccount(account);
    setIframeOpen(true);
  };

  const switchAccount = (direction) => {
    const currentIndex = accounts.findIndex((a) => a.id === iframeAccount.id);
    const newIndex =
      direction === "next"
        ? (currentIndex + 1) % accounts.length
        : (currentIndex - 1 + accounts.length) % accounts.length;
    setIframeAccount(accounts[newIndex]);
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
        <ATFAutoAvatar
          account={account}
          onPointerDown={(e) => dragControls.start(e)}
        />

        {/* Main content - clickable for iframe */}
        <button
          type="button"
          onClick={openIframe}
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
              <ATFAutoAddress address={account.address} />
              <ATFAutoVersionBadge version={account.version} />
            </div>
          </div>

          {/* Balance */}
          <ATFAutoAccountBalance account={account} />
        </button>

        {/* Edit button */}
        <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
          <Dialog.Trigger asChild>
            <ActionButton>
              <MdEditNote className="size-5" />
            </ActionButton>
          </Dialog.Trigger>
          <ATFAutoEditAccountDialog
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
          <ATFAutoAccountDetailsDialog account={account} />
        </Dialog.Root>

        {/* Iframe dialog */}
        <Dialog.Root open={iframeOpen} onOpenChange={setIframeOpen}>
          <ATFAutoAccountIframeDialog
            account={iframeAccount}
            accounts={accounts}
            onSwitchAccount={switchAccount}
          />
        </Dialog.Root>
      </div>
    </Reorder.Item>
  );
});
