import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import BotWebAIcon from "@/assets/images/bot-web-a.png?format=webp&w=80";
import BotWebKIcon from "@/assets/images/bot-web-k.png?format=webp&w=80";
import CloudStatus from "@/partials/CloudStatus";
import CloudSubscription from "@/partials/CloudSubscription";
import CloudTelegramSessionStatus from "@/partials/CloudTelegramSessionStatus";
import Connect from "@/partials/Connect";
import Donate from "@/partials/Donate";
import DropButton from "@/components/DropButton";
import FarmerLinks from "@/partials/FarmerLinks";
import Settings from "@/partials/Settings";
import Shutdown from "@/partials/Shutdown";
import TelegramUser from "@/partials/TelegramUser";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import WelcomeIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=224";
import axios from "axios";
import defaultSettings from "@/core/defaultSettings";
import useAppContext from "@/hooks/useAppContext";
import useAppQuery from "@/hooks/useAppQuery";
import useMirroredState from "@/hooks/useMirroredState";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { CgSpinner } from "react-icons/cg";
import {
  HiOutlineArrowPath,
  HiOutlineArrowUpRight,
  HiOutlineArrowsPointingOut,
  HiOutlineCog6Tooth,
  HiOutlineCurrencyDollar,
  HiOutlinePower,
  HiOutlinePuzzlePiece,
} from "react-icons/hi2";
import { RiRemoteControlLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { forwardRef, memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";

/** Telegram Web Button */
const TelegramWebButton = memo(
  forwardRef(({ icon, children, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      className={cn(
        "p-2",
        "rounded-full",
        "bg-neutral-100 dark:bg-neutral-700",
        "hover:bg-blue-500 dark:hover:bg-blue-800",
        "hover:text-white",
        "inline-flex items-center justify-center gap-1",
        props.className
      )}
    >
      <img src={icon} className="w-6 h-6" />
      {children}
    </button>
  ))
);

/** Toolbar Button */
const ToolbarButton = memo(
  forwardRef(({ icon: Icon, children, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      className={cn(
        "p-2 rounded-full shrink-0",
        "bg-neutral-50 dark:bg-neutral-700",
        "hover:bg-neutral-100 dark:hover:bg-neutral-600",

        props.className
      )}
    >
      <Icon className="size-5" />
      {children}
    </button>
  ))
);

export default memo(function Welcome() {
  const [
    showSettingsPanel,
    setShowSettingsPanel,
    dispatchAndSetShowSettingsPanel,
  ] = useMirroredState("app.toggle-settings-panel", false);

  const [showLinksPanel, setShowLinksPanel, dispatchAndSetShowLinksPanel] =
    useMirroredState("app.toggle-links-panel", false);

  const {
    farmers,
    drops,
    settings,
    mirror,
    telegramUser,
    openNewTab,
    openExtensionsPage,
    openTelegramWeb,
    dispatchAndSetActiveTab,
    dispatchAndReloadApp,
    dispatchAndOpenFarmerBot,
    dispatchAndOpenTelegramBot,
  } = useAppContext();

  const tabs = useMirroredTabs("app", ["farmers", "bots"]);

  const settingTabs = useMirroredTabs("app.settings-tabs", [
    "settings",
    "farmers",
    "seeker",
  ]);

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

  /** Toggle FullScreen */
  const toggleFullScreen = useCallback(function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  /** Configure Settings */
  const configureAppSettings = useCallback(() => {
    settingTabs.setValue("settings");
    setShowSettingsPanel(true);
  }, [settingTabs.setValue, setShowSettingsPanel]);

  /** Configure Farmers */
  const configureFarmers = useCallback(() => {
    settingTabs.dispatchAndSetValue("farmers");
    dispatchAndSetShowSettingsPanel(true);
  }, [settingTabs.dispatchAndSetValue, dispatchAndSetShowSettingsPanel]);

  /** Update Title */
  useEffect(() => {
    document.title = `${
      settings.farmerTitle || defaultSettings.farmerTitle
    } - ${import.meta.env.VITE_APP_NAME}`;
  }, [settings.farmerTitle, defaultSettings.farmerTitle]);

  return (
    <>
      {/* Settings and New Window Button */}
      <div className="p-2 shrink-0">
        <div className="flex justify-between w-full gap-1 mx-auto overflow-auto max-w-96">
          <div className="flex gap-1">
            {/* Shutdown */}
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <ToolbarButton icon={HiOutlinePower} title="Shutdown Farmer" />
              </Dialog.Trigger>
              <Shutdown />
            </Dialog.Root>

            {/* Toggle Fullscreen */}
            <ToolbarButton
              title="Toggle Fullscreen"
              icon={HiOutlineArrowsPointingOut}
              onClick={toggleFullScreen}
            />

            {/* Reload Window */}
            <ToolbarButton
              title="Reload Farmer"
              icon={HiOutlineArrowPath}
              onClick={() => dispatchAndReloadApp()}
            />
          </div>

          <div className="flex gap-1">
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

              <Settings tabs={settingTabs} />
            </Dialog.Root>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-2 overflow-auto grow scrollbar-thin">
        <div className="flex flex-col w-full gap-2 mx-auto my-auto max-w-96">
          {/* App Icon */}
          <img src={WelcomeIcon} className="mx-auto h-28" />

          {/* App Title */}
          <h3
            className={cn(
              "leading-none font-turret-road",
              "text-2xl text-center"
            )}
          >
            {import.meta.env.VITE_APP_NAME}
          </h3>

          {/* App Version */}
          <p className="text-lg leading-none text-center">
            <span className={cn("font-turret-road font-bold text-orange-500")}>
              v{chrome?.runtime?.getManifest().version || "0.0.1"}
            </span>
          </p>

          {/* Farmer Title */}
          <p
            onClick={configureAppSettings}
            className="font-bold leading-none text-center text-blue-500 cursor-pointer"
          >
            {settings.farmerTitle || defaultSettings.farmerTitle}
          </p>

          {/* Cloud Status */}
          <CloudStatus />

          {/* Cloud Telegram Session Status */}
          <CloudTelegramSessionStatus />

          {/* Mirror Status */}
          {settings.enableMirror ? (
            <p
              className={cn(
                "text-center flex items-center justify-center gap-2",
                mirror.connected
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-500"
              )}
            >
              <RiRemoteControlLine className="w-4 h-4" /> Mirror:{" "}
              {mirror.connected ? "Connected" : "Disconnected"}
            </p>
          ) : null}

          {/* Cloud Subscription */}
          <CloudSubscription />

          {/* Display User */}
          {telegramUser && settings.displayUserInfo ? (
            <div className="px-2">
              <TelegramUser user={telegramUser} className="max-w-xs mx-auto" />
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            {/* Open Farmer Bot */}
            <div className="flex justify-center gap-1">
              {["k", "a"].map((v) => (
                <TelegramWebButton
                  key={v}
                  onClick={() => dispatchAndOpenFarmerBot(v)}
                  className={cn(
                    "border border-transparent",
                    "dark:border-orange-500",
                    "bg-orange-100 dark:bg-transparent",
                    "text-orange-900 dark:text-orange-500",
                    "hover:bg-orange-500 dark:hover:bg-orange-500"
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
                    "dark:data-[state=active]:bg-blue-900",
                    "dark:data-[state=active]:text-blue-100",
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
                    "dark:data-[state=active]:bg-blue-900",
                    "dark:data-[state=active]:text-blue-100",
                    "uppercase"
                  )}
                >
                  Links
                </Dialog.Trigger>
                <FarmerLinks />
              </Dialog.Root>
            </Tabs.List>
            <Tabs.Content value="farmers" className="flex flex-col gap-2">
              {/* Configure Farmers */}
              <button
                onClick={configureFarmers}
                className={cn(
                  "font-bold",
                  "flex items-center justify-center",
                  "rounded-lg shrink-0",
                  "bg-blue-100 dark:bg-blue-900",
                  "text-blue-800 dark:text-blue-100",
                  "p-2"
                )}
              >
                Configure Farmers {drops.length} / {farmers.length}
              </button>

              {/* Drops */}
              <div
                className={cn(
                  "flex w-full",
                  settings.farmersLayout === "grid"
                    ? "flex-wrap justify-center"
                    : "flex-col gap-2"
                )}
              >
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
                <div
                  className={cn(
                    "flex w-full",
                    settings.farmersLayout === "grid"
                      ? "flex-wrap justify-center"
                      : "flex-col gap-2"
                  )}
                >
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
          <Connect />
          <div className="flex items-center justify-center gap-2 text-xs">
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <a
                  role="button"
                  className={cn(
                    "text-blue-500",
                    "px-4 py-2",
                    "rounded-full",
                    "border border-blue-500",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  <HiOutlineCurrencyDollar className="w-4 h-4" />
                  Donate
                </a>
              </Dialog.Trigger>
              <Donate />
            </Dialog.Root>
          </div>
        </div>
      </div>
    </>
  );
});
