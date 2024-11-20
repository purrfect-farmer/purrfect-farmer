import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import BotWebAIcon from "@/assets/images/bot-web-a.png?format=webp&w=80";
import BotWebKIcon from "@/assets/images/bot-web-k.png?format=webp&w=80";
import Settings from "@/partials/Settings";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import WelcomeIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=224";
import axios from "axios";
import defaultSettings from "@/defaultSettings";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketState from "@/hooks/useSocketState";
import { CgSpinner } from "react-icons/cg";
import {
  HiOutlineArrowPath,
  HiOutlineArrowUpRight,
  HiOutlineCog6Tooth,
  HiOutlinePower,
  HiOutlinePuzzlePiece,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import DropButton from "./components/DropButton";
import FarmerLinks from "./partials/FarmerLinks";
import Shutdown from "./partials/Shutdown";
import farmerTabs from "./farmerTabs";
import useAppQuery from "./hooks/useAppQuery";
import useSocketTabs from "./hooks/useSocketTabs";

/** Telegram Web Button */
const TelegramWebButton = forwardRef(({ icon, children, ...props }, ref) => (
  <button
    {...props}
    ref={ref}
    className={cn(
      "p-2",
      "rounded-full",
      "bg-neutral-100",
      "hover:bg-blue-500",
      "hover:text-white",
      "inline-flex items-center justify-center gap-1",
      props.className
    )}
  >
    <img src={icon} className="w-6 h-6" />
    {children}
  </button>
));

/** Toolbar Button */
const ToolbarButton = forwardRef(({ icon: Icon, children, ...props }, ref) => (
  <button
    {...props}
    ref={ref}
    className={cn(
      "p-2.5 rounded-full shrink-0",
      "bg-neutral-50 hover:bg-neutral-100",
      props.className
    )}
  >
    <Icon className="w-5 h-5" />
    {children}
  </button>
));

export default function Welcome() {
  const [
    showSettingsPanel,
    setShowSettingsPanel,
    dispatchAndSetShowSettingsPanel,
  ] = useSocketState("app.toggle-settings-panel", false);

  const [showLinksPanel, setShowLinksPanel, dispatchAndSetShowLinksPanel] =
    useSocketState("app.toggle-links-panel", false);

  const {
    settings,
    socket,
    openNewTab,
    openExtensionsPage,
    openTelegramWeb,
    dispatchAndSetActiveTab,
    dispatchAndReloadApp,
    dispatchAndOpenFarmerBot,
    dispatchAndOpenTelegramBot,
  } = useAppContext();

  const tabs = useSocketTabs("app", ["farmers", "bots"]);

  /** Hidden Toggle */
  const [showHidden, setShowHidden] = useState(import.meta.env.DEV);

  /** Drops List */
  const drops = useMemo(
    () =>
      farmerTabs.filter(
        (item) =>
          !["app", "telegram-web-k", "telegram-web-a"].includes(item.id) &&
          (showHidden || !item.hidden)
      ),
    [showHidden, farmerTabs]
  );

  /** Show Hidden Drops */
  const [showHiddenDrops, dispatchAndShowHiddenDrops] =
    useSocketDispatchCallback(
      "app.show-hidden-drops",
      () => {
        setShowHidden(true);
        toast.success("Unlocked hidden farmer!");
      },
      [setShowHidden]
    );

  /** Bots Query */
  const botsQuery = useAppQuery({
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
    retry: true,
    queryKey: ["app", "farmer", "bots"],
    queryFn: ({ signal }) =>
      axios
        .get(`${import.meta.env.VITE_APP_FARMER_BOTS_URL}?time=${Date.now()}`, {
          signal,
        })
        .then((res) => res.data),
  });

  /** Bot List */
  const bots = useMemo(
    () =>
      botsQuery.data?.map((bot) => ({
        ...bot,
        icon: new URL(
          bot.icon + ".png",
          import.meta.env.VITE_APP_FARMER_BOTS_ICON_BASE_URL
        ).toString(),
      })),
    [botsQuery.data]
  );

  /** Update Title */
  useEffect(() => {
    document.title = `${
      settings.farmerTitle || defaultSettings.farmerTitle
    } - ${import.meta.env.VITE_APP_NAME}`;
  }, [settings]);

  return (
    <>
      {/* Settings and New Window Button */}
      <div className="p-2 shrink-0">
        <div className="flex justify-between w-full gap-2 mx-auto max-w-96">
          <div className="flex gap-2">
            {/* Shutdown */}
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <ToolbarButton icon={HiOutlinePower} title="Shutdown Farmer" />
              </Dialog.Trigger>
              <Shutdown />
            </Dialog.Root>

            {/* Reload Window */}
            <ToolbarButton
              title="Reload Farmer"
              icon={HiOutlineArrowPath}
              onClick={() => dispatchAndReloadApp()}
            />
          </div>

          <div className="flex gap-2">
            {/* Open New Tab */}
            <ToolbarButton
              title="Open New Tab"
              onClick={openNewTab}
              icon={HiOutlineArrowUpRight}
            />

            {/* Open Extensions Page */}
            <ToolbarButton
              title="Open Extensions Page"
              onClick={openExtensionsPage}
              icon={HiOutlinePuzzlePiece}
            />

            {/* Settings */}
            <Dialog.Root
              open={showSettingsPanel}
              onOpenChange={dispatchAndSetShowSettingsPanel}
            >
              <Dialog.Trigger asChild>
                <ToolbarButton icon={HiOutlineCog6Tooth} title="Settings" />
              </Dialog.Trigger>

              <Settings />
            </Dialog.Root>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-2 overflow-auto grow scrollbar-thin">
        <div className="flex flex-col w-full gap-2 mx-auto my-auto max-w-96">
          {/* App Icon */}
          <img src={WelcomeIcon} className="mx-auto h-28" />

          {/* App Title */}
          <h3 className="text-2xl text-center font-turret-road">
            {import.meta.env.VITE_APP_NAME}
          </h3>

          {/* App Version */}
          <p className="text-lg text-center">
            <span
              className={cn(
                "font-turret-road",
                "text-transparent font-bold",
                "bg-clip-text",
                "bg-gradient-to-r from-pink-500 to-violet-500"
              )}
            >
              v{chrome?.runtime?.getManifest().version}
            </span>
          </p>

          {/* Farmer Title */}
          <p
            onClick={() => setShowSettingsPanel(true)}
            className="font-bold text-center text-blue-500 cursor-pointer"
          >
            {settings.farmerTitle || defaultSettings.farmerTitle}
          </p>

          {/* Sync Status */}
          <p
            className={cn(
              "text-center",
              socket.connected ? "text-green-500" : "text-red-500"
            )}
          >
            {socket.connected ? "Connected" : "Disconnected"}
          </p>

          <div className="flex flex-col gap-1">
            {/* Open Farmer Bot */}
            <div className="flex justify-center gap-1">
              {["k", "a"].map((v) => (
                <TelegramWebButton
                  key={v}
                  onClick={() => dispatchAndOpenFarmerBot(v)}
                  className={cn(
                    "bg-orange-100",
                    "text-orange-800",
                    "hover:bg-orange-500"
                  )}
                  title={`Open ${
                    import.meta.env.VITE_APP_BOT_NAME
                  } in Telegram Web${v.toUpperCase()}`}
                  icon={v === "k" ? BotWebKIcon : BotWebAIcon}
                >
                  {import.meta.env.VITE_APP_BOT_NAME}-{v.toUpperCase()}
                </TelegramWebButton>
              ))}
            </div>

            {/* TelegramWeb */}
            <div className="flex justify-center gap-1">
              {["k", "a"].map((v) => (
                <TelegramWebButton
                  key={v}
                  onClick={() => openTelegramWeb(v)}
                  title={`Open Telegram Web-${v.toUpperCase()}`}
                  icon={v === "k" ? TelegramWebKIcon : TelegramWebAIcon}
                >
                  {`Web-${v.toUpperCase()}`}
                </TelegramWebButton>
              ))}
            </div>
          </div>

          <Tabs.Root
            {...tabs.rootProps}
            className="flex flex-col gap-2 px-1 py-2"
          >
            <Tabs.List className="grid grid-cols-3 px-1">
              {tabs.list.map((value, index) => (
                <Tabs.Trigger
                  key={index}
                  value={value}
                  className={cn(
                    "p-2 rounded-lg",
                    "border-b-2 border-transparent",
                    "data-[state=active]:bg-blue-100",
                    "data-[state=active]:text-blue-800",
                    "uppercase"
                  )}
                >
                  {value}
                </Tabs.Trigger>
              ))}

              {/* Links */}
              <Dialog.Root
                open={showLinksPanel}
                onOpenChange={dispatchAndSetShowLinksPanel}
              >
                <Dialog.Trigger
                  className={cn(
                    "p-2 rounded-lg",
                    "border-b-2 border-transparent",
                    "data-[state=active]:bg-blue-100",
                    "data-[state=active]:text-blue-800",
                    "uppercase"
                  )}
                >
                  Links
                </Dialog.Trigger>
                <FarmerLinks />
              </Dialog.Root>
            </Tabs.List>
            <Tabs.Content value="farmers">
              {/* Drops */}
              <div className={cn("flex flex-wrap justify-center w-full")}>
                {/* Drops */}
                {drops.map((drop) => (
                  <DropButton
                    key={drop.id}
                    drop={drop}
                    onClick={() => dispatchAndSetActiveTab(drop.id)}
                  />
                ))}
              </div>
            </Tabs.Content>
            <Tabs.Content value="bots">
              {/* Bots */}
              {botsQuery.isSuccess ? (
                <div className={cn("flex flex-wrap justify-center w-full")}>
                  {/* Drops */}
                  {bots.map((bot, index) => (
                    <DropButton
                      key={index}
                      drop={bot}
                      onClick={() =>
                        dispatchAndOpenTelegramBot(bot.telegramLink)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center p-4">
                  <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>

          {/* Connect */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <a
              href={import.meta.env.VITE_APP_TELEGRAM_CHANNEL}
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              Channel
            </a>
            &bull;
            <a
              href={import.meta.env.VITE_APP_DEV_CONTACT}
              target="_blank"
              className="text-blue-500 hover:underline"
            >
              Dev
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
