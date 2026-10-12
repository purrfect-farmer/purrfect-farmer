import { Dialog, Tabs } from "radix-ui";

import AutoAccountBalance from "./AutoAccountBalance";
import AutoAccountSwitcher from "./AutoAccountSwitcher";
import AutoAddress from "./AutoAddress";
import AutoAvatar from "./AutoAvatar";
import AutoBoosterBoostTab from "./AutoBoosterBoostTab";
import AutoBoosterCollectTab from "./AutoBoosterCollectTab";
import AutoBoosterDetailsTab from "./AutoBoosterDetailsTab";
import AutoBoosterSendTab from "./AutoBoosterSendTab";
import AutoBoosterSwapTab from "./AutoBoosterSwapTab";
import AutoBoosterWithdrawTab from "./AutoBoosterWithdrawTab";
import AutoDropVerifiedBadge from "./AutoDropVerifiedBadge";
import AutoVerifiedBadge from "./AutoVerifiedBadge";
import AutoVersionBadge from "./AutoVersionBadge";
import { HiOutlineXMark } from "react-icons/hi2";
import { MdOutlineContentCopy } from "react-icons/md";
import { cn } from "@/utils";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import { useState } from "react";

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
      {/* Avatar */}
      <AutoAvatar account={account} />

      {/* Title + info */}
      <div className="flex flex-col justify-center items-center gap-0.5 grow min-w-0">
        {/* Title */}
        <Dialog.Title className="font-bold text-sm truncate flex items-center gap-1">
          {account.title}
          <AutoVerifiedBadge verified={account.verified} />
          <AutoDropVerifiedBadge account={account} />
        </Dialog.Title>

        {/* Description */}
        <Dialog.Description className="sr-only">
          {account.title} webview
        </Dialog.Description>

        {/* Telegram User ID */}
        <span
          onClick={() => {
            copy(account.userId);
            toast.success("Telegram User ID copied!");
          }}
          className={cn(
            "text-center text-lime-500 font-bold",
            "flex items-center gap-1 cursor-pointer",
          )}
        >
          <MdOutlineContentCopy className="shrink-0 size-3" />
          {account.userId}
        </span>

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
          <AutoVersionBadge version={account.version} />
          <AutoAddress address={account.address} />
          <MdOutlineContentCopy className="shrink-0 size-3" />
        </span>

        {/* Balances */}
        <AutoAccountBalance account={account} className="justify-center" />
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

export default function AutoAccountBooster({ account }) {
  const { config } = useAuto();
  const [tab, setTab] = useState("boost");

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

          {/* Previous / next account */}
          <AutoAccountSwitcher
            account={account}
            className="border-b border-neutral-200 dark:border-neutral-700"
          />

          {/* Tabs */}
          <Tabs.Root
            value={tab}
            onValueChange={setTab}
            className="flex flex-col size-full overflow-hidden"
          >
            <Tabs.List
              className={cn(
                "grid shrink-0",
                config.native ? "grid-cols-5" : "grid-cols-6",
              )}
            >
              <BoosterTabTrigger title="Boost" value="boost" />
              <BoosterTabTrigger title="Collect" value="collect" />
              <BoosterTabTrigger title="Withdraw" value="withdraw" />
              <BoosterTabTrigger title="Send" value="send" />
              {!config.native && (
                <BoosterTabTrigger title="Swap" value="swap" />
              )}
              <BoosterTabTrigger title="Details" value="details" />
            </Tabs.List>

            {/* Keyed so no tab state carries over to the next account */}
            <div key={account.id} className="grow overflow-auto p-4">
              <Tabs.Content value="boost">
                <AutoBoosterBoostTab account={account} />
              </Tabs.Content>
              <Tabs.Content value="collect">
                <AutoBoosterCollectTab account={account} />
              </Tabs.Content>
              <Tabs.Content
                forceMount
                value="withdraw"
                className="data-[state=inactive]:hidden"
              >
                <AutoBoosterWithdrawTab account={account} />
              </Tabs.Content>
              <Tabs.Content value="send">
                <AutoBoosterSendTab account={account} />
              </Tabs.Content>
              {!config.native && (
                <Tabs.Content value="swap">
                  <AutoBoosterSwapTab account={account} />
                </Tabs.Content>
              )}
              <Tabs.Content value="details">
                <AutoBoosterDetailsTab account={account} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
