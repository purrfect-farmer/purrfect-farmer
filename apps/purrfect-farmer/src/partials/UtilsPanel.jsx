import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import Input from "@/components/Input";
import ButtomDialog from "@/components/ButtomDialog";
import LabelToggle from "@/components/LabelToggle";
import Tabs from "@/components/Tabs";
import useAppContext from "@/hooks/useAppContext";
import { Dialog } from "radix-ui";
import { HiArrowTopRightOnSquare, HiUserPlus } from "react-icons/hi2";
import { cn, isBotURL } from "@/lib/utils";
import { memo, useState } from "react";
import { utils } from "@/core/tabs";

export default memo(function UtilsPanel() {
  const {
    utilsPanelTabs,
    sharedSettings,
    dispatchAndConfigureSharedSettings,
    dispatchAndSetShowUtilsPanel,
    dispatchAndSetActiveTab,
    dispatchAndOpenTelegramBot,
    dispatchAndOpenTelegramLink,
    dispatchAndJoinTelegramLink,
  } = useAppContext();

  const [telegramLink, setTelegramLink] = useState("");

  return (
    <ButtomDialog
      title={import.meta.env.VITE_CORE_SYSTEM_NAME}
      description={"Core System Tools"}
      icon={CoreSystemIcon}
    >
      <Tabs
        tabs={utilsPanelTabs}
        rootClassName={"gap-4"}
        triggerClassName={"data-[state=active]:border-blue-500"}
      >
        {/* Utils */}
        <Tabs.Content value="utils">
          <div className="flex flex-col gap-2">
            {/* (SHARED) Show Mini-App Toolbar */}
            <LabelToggle
              onChange={(ev) => {
                dispatchAndConfigureSharedSettings(
                  "showMiniAppToolbar",
                  ev.target.checked
                );
              }}
              checked={sharedSettings?.showMiniAppToolbar}
            >
              Show Mini-App Toolbar
            </LabelToggle>

            {/* Open Telegram Link */}
            <label className="mt-2 text-neutral-400">Open Telegram Link</label>
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
                  dispatchAndSetShowUtilsPanel(false);
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
                  dispatchAndSetShowUtilsPanel(false);
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
              You can paste any valid telegram link e.g your referral link, a
              channel etc.
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
              <h3 className={cn("min-w-0 truncate w-full", "font-bold")}>
                {tab.title}
              </h3>
            </Dialog.Close>
          ))}
        </Tabs.Content>
      </Tabs>
    </ButtomDialog>
  );
});
