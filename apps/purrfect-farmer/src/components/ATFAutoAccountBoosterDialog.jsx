import { Dialog, Tabs } from "radix-ui";

import ATFAutoAccountBalance from "./ATFAutoAccountBalance";
import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoAvatar from "./ATFAutoAvatar";
import ATFAutoBoosterBoostTab from "./ATFAutoBoosterBoostTab";
import ATFAutoBoosterCollectTab from "./ATFAutoBoosterCollectTab";
import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import { HiOutlineXMark } from "react-icons/hi2";
import { MdOutlineContentCopy } from "react-icons/md";
import { cn } from "@/utils";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";

const BoosterTabTrigger = ({ title, value }) => (
  <Tabs.Trigger
    value={value}
    className={cn(
      "px-4 py-2 truncate",
      "font-bold cursor-pointer",
      "text-neutral-500 dark:text-neutral-400 hover:text-orange-500",
      "data-[state=active]:text-orange-500 border-b-2 border-b-transparent",
      "data-[state=active]:border-b-orange-500",
      "focus:outline-none focus:ring-0",
    )}
  >
    {title}
  </Tabs.Trigger>
);

function BoosterHeader({ account }) {
  return (
    <div
      className={cn(
        "flex gap-2 items-center shrink-0 p-3",
        "border-b border-neutral-200 dark:border-neutral-700",
      )}
    >
      {/*  Avatar */}
      <ATFAutoAvatar account={account} />

      {/* Title + info */}
      <div className="flex flex-col justify-center items-center gap-0.5 grow min-w-0">
        {/* Title */}
        <Dialog.Title className="font-bold text-sm truncate">
          {account.title}
        </Dialog.Title>

        {/* Description */}
        <Dialog.Description className="sr-only">
          {account.title} webview
        </Dialog.Description>

        {/* Address */}
        <span
          onClick={() => {
            copy(account.address);
            toast.success("Address copied!");
          }}
          className={cn(
            "text-xs text-blue-500 dark:text-blue-300 truncate",
            "cursor-pointer hover:underline",
            "flex items-center gap-1",
          )}
        >
          <ATFAutoVersionBadge version={account.version} />
          <ATFAutoAddress address={account.address} />
          <MdOutlineContentCopy className="shrink-0 size-3" />
        </span>

        {/* Balances */}
        <ATFAutoAccountBalance account={account} className="justify-center" />
      </div>

      {/* Close */}
      <Dialog.Close
        className={cn(
          "size-10 shrink-0 rounded-full",
          "flex items-center justify-center",
          "text-neutral-400 hover:text-orange-500 cursor-pointer",
          "transition-colors",
        )}
      >
        <HiOutlineXMark className="size-5" />
      </Dialog.Close>
    </div>
  );
}

export default function ATFAutoAccountBoosterDialog({ account }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40",
          "flex items-center justify-center",
          "bg-black/50 p-4",
        )}
      >
        <Dialog.Content
          onInteractOutside={(ev) => ev.preventDefault()}
          className={cn(
            "flex flex-col w-full h-full max-w-md max-h-[90vh]",
            "bg-white dark:bg-neutral-800 rounded-xl overflow-hidden",
          )}
        >
          {/* Header */}
          <BoosterHeader account={account} />

          {/* Booster tabs */}
          <Tabs.Root
            defaultValue="boost"
            className="flex flex-col size-full overflow-hidden"
          >
            <Tabs.List className="grid grid-cols-2 shrink-0">
              <BoosterTabTrigger title="Boost" value="boost" />
              <BoosterTabTrigger title="Collect" value="collect" />
            </Tabs.List>

            <div className="grow overflow-auto p-4">
              <Tabs.Content value="boost">
                <ATFAutoBoosterBoostTab account={account} />
              </Tabs.Content>
              <Tabs.Content value="collect">
                <ATFAutoBoosterCollectTab account={account} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
