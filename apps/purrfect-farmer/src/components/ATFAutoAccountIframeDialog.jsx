import { Dialog, Tabs } from "radix-ui";
import {
  MdChevronLeft,
  MdChevronRight,
  MdOutlineContentCopy,
} from "react-icons/md";
import { useCallback, useState } from "react";

import ATFAutoAccountBalance from "./ATFAutoAccountBalance";
import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import ATFAutoWebviewBoostTab from "./ATFAutoWebviewBoostTab";
import ATFAutoWebviewCollectTab from "./ATFAutoWebviewCollectTab";
import { HiOutlineXMark } from "react-icons/hi2";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { cn } from "@/utils";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";

const SwitcherButton = (props) => (
  <button
    {...props}
    className={cn(
      "size-10 shrink-0 rounded-xl",
      "flex items-center justify-center",
      "cursor-pointer",
      "hover:bg-orange-500 hover:text-white hover:border-orange-500",
      "transition-colors",
    )}
  />
);

const AsideTabTrigger = ({ title, value }) => (
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

function WebviewHeader({ account, showAside, toggleAside }) {
  return (
    <div
      className={cn(
        "flex gap-2 items-center shrink-0 p-3",
        "border-b border-neutral-200 dark:border-neutral-700",
      )}
    >
      {/* Toggle aside / avatar */}
      <button
        onClick={toggleAside}
        className={cn(
          "size-10 shrink-0 rounded-full",
          "flex items-center justify-center",
          "cursor-pointer transition-colors",
          showAside
            ? [
                "bg-neutral-100 dark:bg-neutral-700",
                "hover:bg-neutral-200 dark:hover:bg-neutral-600",
              ]
            : "bg-orange-500 text-white hover:bg-orange-600",
        )}
      >
        {showAside ? (
          <MdOutlineArrowBackIos className="size-4 text-orange-500" />
        ) : (
          <span className="text-sm font-bold">
            {account.title
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() || "")
              .join("")}
          </span>
        )}
      </button>

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
        <ATFAutoAccountBalance address={account.address} />
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

function WebviewAside({ account }) {
  return (
    <Tabs.Root
      defaultValue="boost"
      className="flex flex-col size-full overflow-hidden"
    >
      <Tabs.List className="grid grid-cols-2 shrink-0">
        <AsideTabTrigger title="Boost" value="boost" />
        <AsideTabTrigger title="Collect" value="collect" />
      </Tabs.List>

      <div className="grow overflow-auto p-4">
        <Tabs.Content value="boost">
          <ATFAutoWebviewBoostTab account={account} />
        </Tabs.Content>
        <Tabs.Content value="collect">
          <ATFAutoWebviewCollectTab account={account} />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}

export default function ATFAutoAccountIframeDialog({
  account,
  accounts,
  onSwitchAccount,
}) {
  const showSwitcher = accounts && accounts.length > 1;
  const [showAside, setShowAside] = useState(false);
  const toggleAside = useCallback(() => setShowAside((prev) => !prev), []);

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
          <WebviewHeader
            account={account}
            showAside={showAside}
            toggleAside={toggleAside}
          />

          {/* Sliding two-panel */}
          <div className="grow min-w-0 min-h-0 overflow-hidden">
            <div
              className={cn(
                "grid grid-cols-2 w-[200%] h-full",
                showAside ? "translate-x-[-50%]" : "translate-x-0",
                "transition-transform duration-500 ease-in-out",
              )}
            >
              {/* Webview panel */}
              <iframe
                key={account.id}
                src={account.url}
                className="size-full border-0"
                allow="clipboard-write"
              />

              {/* Aside panel */}
              <WebviewAside account={account} />
            </div>
          </div>

          {/* Account Switcher */}
          {showSwitcher && (
            <div className="flex gap-2 items-center justify-center shrink-0 p-2 border-t border-neutral-200 dark:border-neutral-700">
              <SwitcherButton onClick={() => onSwitchAccount("previous")}>
                <MdChevronLeft className="size-6" />
              </SwitcherButton>
              <SwitcherButton onClick={() => onSwitchAccount("next")}>
                <MdChevronRight className="size-6" />
              </SwitcherButton>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
