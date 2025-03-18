import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import useAppContext from "@/hooks/useAppContext";
import { HiArrowTopRightOnSquare, HiUserPlus } from "react-icons/hi2";
import { cn, isBotURL } from "@/lib/utils";
import { memo, useState } from "react";
import { utils } from "@/core/tabs";

export default memo(function UtilsPanel({ tabs, onOpenChange }) {
  const {
    settings,
    dispatchAndConfigureSettings,
    dispatchAndSetActiveTab,
    dispatchAndOpenTelegramBot,
    dispatchAndOpenTelegramLink,
    dispatchAndJoinTelegramLink,
  } = useAppContext();

  const [telegramLink, setTelegramLink] = useState("");

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        className={cn(
          "bg-white dark:bg-neutral-800",
          "fixed z-50 inset-x-0 bottom-0 flex flex-col h-3/4 rounded-t-xl",
          "flex flex-col"
        )}
        onOpenAutoFocus={(ev) => ev.preventDefault()}
      >
        <>
          <div className="flex flex-col min-w-0 min-h-0 gap-2 p-4 overflow-auto grow">
            {/* Icon */}
            <img src={CoreSystemIcon} className="w-10 mx-auto" />

            {/* Title */}
            <Dialog.Title className="text-xl text-center">
              <span
                className={cn(
                  "text-transparent font-turret-road font-bold",
                  "bg-clip-text",
                  "bg-linear-to-r from-green-500 to-blue-400"
                )}
              >
                {import.meta.env.VITE_CORE_SYSTEM_NAME}
              </span>
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="sr-only">
              Core System Tools
            </Dialog.Description>

            <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
              <Tabs.List className="grid grid-cols-2">
                {tabs.list.map((value, index) => (
                  <Tabs.Trigger
                    key={index}
                    value={value}
                    className={cn(
                      "p-2",
                      "border-b-2 border-transparent",
                      "data-[state=active]:border-blue-500"
                    )}
                  >
                    {value.toUpperCase()}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {/* Farmer */}
              <Tabs.Content value="farmer">
                <div className="flex flex-col gap-2">
                  {/* Show Mini-App Toolbar */}
                  <LabelToggle
                    onChange={(ev) => {
                      dispatchAndConfigureSettings(
                        "showMiniAppToolbar",
                        ev.target.checked
                      );
                    }}
                    checked={settings?.showMiniAppToolbar}
                  >
                    Show Mini-App Toolbar
                  </LabelToggle>

                  {/* Open Telegram Link */}
                  <label className="mt-2 text-neutral-400">
                    Open Telegram Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={telegramLink}
                      onChange={(ev) => setTelegramLink(ev.target.value)}
                      placeholder="e.g https://t.me/..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Join Button */}
                    <button
                      className={cn(
                        "inline-flex gap-2 items-center justify-center",
                        "py-2 px-4 rounded-lg shrink-0 font-bold",
                        "text-white bg-green-500"
                      )}
                      onClick={() => {
                        dispatchAndJoinTelegramLink(telegramLink);
                        onOpenChange(false);
                      }}
                    >
                      <HiUserPlus className="w-4 h-4 " /> Join
                    </button>

                    {/* Open Button */}
                    <button
                      className={cn(
                        "inline-flex gap-2 items-center justify-center",
                        "py-2 px-4 rounded-lg shrink-0 font-bold",
                        "text-white bg-blue-500"
                      )}
                      onClick={() => {
                        isBotURL(telegramLink)
                          ? dispatchAndOpenTelegramBot(telegramLink)
                          : dispatchAndOpenTelegramLink(telegramLink);
                        onOpenChange(false);
                      }}
                    >
                      <HiArrowTopRightOnSquare className="w-4 h-4 " /> Open
                    </button>
                  </div>
                  <p
                    className={cn(
                      "bg-yellow-100",
                      "text-yellow-800 dark:text-yellow-900",
                      "p-4 text-center  rounded-lg"
                    )}
                  >
                    You can paste any valid telegram link e.g your referral
                    link, a channel etc.
                  </p>
                </div>
              </Tabs.Content>

              {/* System */}
              <Tabs.Content value="system" className="flex flex-col gap-2">
                {utils.map((tab) => (
                  <Dialog.Close
                    onClick={() => dispatchAndSetActiveTab(tab.id)}
                    key={tab.id}
                    className={cn(
                      "bg-neutral-100 dark:bg-neutral-700",
                      "flex items-center gap-2 p-2 cursor-pointer rounded-xl",
                      "text-left"
                    )}
                  >
                    <img
                      src={tab.icon}
                      className={cn("w-6 h-6 rounded-full shrink-0")}
                    />
                    <h3 className={cn("min-w-0 truncate w-full")}>
                      {tab.title}
                    </h3>
                  </Dialog.Close>
                ))}
              </Tabs.Content>
            </Tabs.Root>
          </div>
          <div className="flex flex-col p-4 font-bold shrink-0">
            <Dialog.Close className="p-2.5 text-white bg-blue-500 rounded-lg">
              Close
            </Dialog.Close>
          </div>
        </>
      </Dialog.Content>
    </Dialog.Portal>
  );
});
