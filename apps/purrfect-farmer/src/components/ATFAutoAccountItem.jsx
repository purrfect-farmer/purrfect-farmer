import { Reorder, useDragControls } from "motion/react";
import { memo, useMemo, useState } from "react";

import ATFAutoAccountBalance from "./ATFAutoAccountBalance";
import ATFAutoAccountDetailsDialog from "./ATFAutoAccountDetailsDialog";
import ATFAutoAccountIframeDialog from "./ATFAutoAccountIframeDialog";
import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoEditAccountDialog from "./ATFAutoEditAccountDialog";
import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import { Dialog } from "radix-ui";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { IoInformationCircleOutline } from "react-icons/io5";
import { cn } from "@/utils";

function getInitials(title) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function truncateAddress(address) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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
  const initials = useMemo(() => getInitials(account.title), [account.title]);
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
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className={cn(
            "size-10 shrink-0 rounded-full",
            "bg-orange-500 text-white",
            "flex items-center justify-center",
            "font-bold text-sm cursor-grab active:cursor-grabbing",
            "touch-none select-none",
          )}
        >
          {initials}
        </div>

        {/* Main content - clickable for iframe */}
        <button
          type="button"
          onClick={openIframe}
          className={cn(
            "flex flex-col grow min-w-0 text-left",
            "px-1 py-0.5 cursor-pointer",
          )}
        >
          <div className="flex items-center">
            {/* Title */}
            <h3 className="font-bold truncate w-full grow min-w-0">
              {account.title}
            </h3>
            {/* Address */}
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              <ATFAutoAddress address={account.address} />
              <ATFAutoVersionBadge version={account.version} />
            </div>
          </div>

          {/* Balance */}
          <ATFAutoAccountBalance address={account.address} />
        </button>

        {/* Edit button */}
        <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
          <Dialog.Trigger asChild>
            <ActionButton>
              <HiOutlinePencilSquare className="size-4" />
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
              <IoInformationCircleOutline className="size-4" />
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
