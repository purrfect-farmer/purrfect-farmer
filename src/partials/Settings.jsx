import Alert from "@/components/Alert";
import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import ResetButton from "@/components/ResetButton";
import Tabs from "@/components/Tabs";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import defaultSettings from "@/core/defaultSettings";
import defaultSharedSettings from "@/core/defaultSharedSettings";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useMirroredState from "@/hooks/useMirroredState";
import { Accordion } from "radix-ui";
import { CgSpinner } from "react-icons/cg";
import { Dialog } from "radix-ui";
import {
  HiBolt,
  HiChevronRight,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineGlobeAlt,
  HiOutlineListBullet,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { PiTrashBold } from "react-icons/pi";
import { Reorder, useDragControls } from "motion/react";
import { TbProgressCheck } from "react-icons/tb";
import { cn, resizeFarmerWindow } from "@/lib/utils";
import { memo, useCallback, useLayoutEffect, useState } from "react";

import Seeker from "./Seeker";

const DropReorderItem = memo(({ children, ...props }) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item {...props} dragListener={false} dragControls={dragControls}>
      <div className="flex gap-2">
        <div className="min-w-0 min-h-0 grow">{children}</div>
        <button
          className={cn(
            "bg-neutral-100 dark:bg-neutral-700",
            "flex items-center justify-center",
            "px-3 rounded-lg shrink-0",
            "touch-none"
          )}
          onPointerDown={(event) => dragControls.start(event)}
        >
          <HiOutlineSquares2X2 className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
});

const SettingsLabel = ({ children }) => (
  <label className="px-1 text-neutral-500 dark:text-neutral-400">
    {children}
  </label>
);

const SettingsContainer = ({ children }) => {
  const [value, , dispatchAndSetValue] = useMirroredState(
    "settings-container",
    "farmer"
  );

  return (
    <Accordion.Root
      className="flex flex-col gap-2"
      value={value}
      onValueChange={dispatchAndSetValue}
      collapsible
    >
      {children}
    </Accordion.Root>
  );
};

const SettingsGroup = ({ id, title, children }) => {
  return (
    <Accordion.Item value={id} className={cn("flex flex-col gap-2")}>
      <Accordion.Trigger
        className={cn(
          "bg-neutral-100 dark:bg-neutral-700",
          "data-[state=open]:bg-blue-500",
          "data-[state=open]:text-white",
          "flex items-center gap-4 p-2 cursor-pointer rounded-xl",
          "group"
        )}
      >
        <h4 className="min-w-0 min-h-0 grow font-bold ml-9">{title}</h4>

        <HiChevronRight
          className={cn("size-5", "group-data-[state=open]:-rotate-90")}
        />
      </Accordion.Trigger>
      <Accordion.Content
        className={cn(
          "flex flex-col gap-2",
          "after:w-2/4 after:h-2",
          "after:rounded-full",
          "after:bg-blue-400",
          "after:mx-auto",
          "after:my-1"
        )}
      >
        {children}
      </Accordion.Content>
    </Accordion.Item>
  );
};

export default memo(function Settings({ tabs }) {
  const {
    account,
    accounts: farmerAccounts,
    updateActiveAccount,
    farmerMode,
    telegramClient,
    settings,
    sharedSettings,
    configureSettings,
    removeActiveAccount,
    configureSharedSettings,
    dispatchAndReloadApp,
    dispatchAndRestoreSettings,
    dispatchAndConfigureSettings,
    dispatchAndConfigureSharedSettings,
    dropsStatus,
    dropsOrder,
    orderedDrops,
  } = useAppContext();

  const {
    mirrorServer: defaultMirrorServer,
    cloudServer: defaultCloudServer,
    seekerServer: defaultSeekerServer,
  } = defaultSettings;

  const {
    mirrorServer: currentMirrorServer,
    cloudServer: currentCloudServer,
    seekerServer: currentSeekerServer,
  } = settings;

  const {
    farmersPerWindow: defaultFarmersPerWindow,
    farmerPosition: defaultFarmerPosition,
  } = defaultSharedSettings;

  const {
    farmersPerWindow: currentFarmersPerWindow,
    farmerPosition: currentFarmerPosition,
  } = sharedSettings;

  /** Mirror Server */
  const [mirrorServer, setMirrorServer] = useState(
    currentMirrorServer || defaultMirrorServer
  );

  /** Cloud Server */
  const [cloudServer, setCloudServer] = useState(
    currentCloudServer || defaultCloudServer
  );

  /** Seeker Server */
  const [seekerServer, setSeekerServer] = useState(
    currentSeekerServer || defaultSeekerServer
  );

  /**(SHARED) Farmers Per Window */
  const [farmersPerWindow, setFarmersPerWindow] = useState(
    currentFarmersPerWindow || defaultFarmersPerWindow
  );

  /** (SHARED) Farmer Position */
  const [farmerPosition, setFarmerPosition] = useState(
    currentFarmerPosition || defaultFarmerPosition
  );

  /** Resize Page */
  const resizeSettingsPage = useCallback(async () => {
    await resizeFarmerWindow();
  }, []);

  /** Handle Set Mirror Server */
  const handleSetMirrorServer = useCallback(() => {
    dispatchAndConfigureSettings("mirrorServer", mirrorServer);
  }, [mirrorServer, dispatchAndConfigureSettings]);

  /** Handle Set Cloud Server */
  const handleSetCloudServer = useCallback(() => {
    dispatchAndConfigureSettings("cloudServer", cloudServer);
  }, [cloudServer, dispatchAndConfigureSettings]);

  /** Handle Set Seeker Server */
  const handleSetSeekerServer = useCallback(() => {
    dispatchAndConfigureSettings("seekerServer", seekerServer);
  }, [seekerServer, dispatchAndConfigureSettings]);

  /** (SHARED) Set Farmers Per Window */
  const [, dispatchAndSetFarmersPerWindow] = useMirroredCallback(
    "shared-settings.farmers-per-window",
    (amount) => {
      /** Store Shared Settings */
      configureSharedSettings("farmersPerWindow", Math.max(3, Number(amount)));

      /** Resize Page */
      resizeSettingsPage();
    },
    [configureSharedSettings, resizeSettingsPage]
  );

  /** (SHARED) Set Farmer Position */
  const handleSetFarmerPosition = useCallback(() => {
    configureSharedSettings(
      "farmerPosition",
      Math.max(1, Math.min(farmersPerWindow, Number(farmerPosition) || 1))
    );

    resizeSettingsPage();
  }, [
    resizeSettingsPage,
    farmersPerWindow,
    farmerPosition,
    configureSharedSettings,
  ]);

  /** Toggle Drop */
  const toggleDrop = useCallback(
    (id, enabled) => {
      dispatchAndConfigureSettings("dropsStatus", {
        ...dropsStatus,
        [id]: enabled,
      });
    },
    [dropsStatus, dispatchAndConfigureSettings]
  );

  /** Update Settings */
  useLayoutEffect(() => {
    /** Set Mirror Server */
    setMirrorServer(currentMirrorServer || defaultMirrorServer);

    /** Set Cloud Server */
    setCloudServer(currentCloudServer || defaultCloudServer);

    /** Set Seeker Server */
    setSeekerServer(currentSeekerServer || defaultSeekerServer);

    /** Set Farmers Per Window */
    setFarmersPerWindow(currentFarmersPerWindow || defaultFarmersPerWindow);

    /** Set Farmer Position */
    setFarmerPosition(currentFarmerPosition || defaultFarmerPosition);
  }, [
    /** Deps */
    settings,
    sharedSettings,
    setMirrorServer,
    setCloudServer,
    setSeekerServer,
    setFarmersPerWindow,
    setFarmerPosition,
  ]);

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
        {settings ? (
          <>
            <div className="flex flex-col min-w-0 min-h-0 gap-2 p-4 overflow-auto grow">
              <Dialog.Title className="text-lg font-bold text-center">
                <span
                  className={cn(
                    "text-transparent font-bold",
                    "bg-clip-text",
                    "bg-linear-to-r from-pink-500 to-violet-500"
                  )}
                >
                  Settings
                </span>
              </Dialog.Title>
              <Dialog.Description className="text-center">
                <span
                  className={cn(
                    "text-transparent font-bold",
                    "bg-clip-text",
                    "bg-linear-to-r from-green-500 to-blue-500"
                  )}
                >
                  Configure the Farmer
                </span>
              </Dialog.Description>

              <Tabs
                tabs={tabs}
                listClassName={"px-2"}
                triggerClassName={"data-[state=active]:border-blue-500"}
              >
                <Tabs.Content value="settings">
                  <form
                    onSubmit={(ev) => ev.preventDefault()}
                    className="flex flex-col gap-2"
                  >
                    <SettingsContainer>
                      {/* Farmer Options */}
                      <SettingsGroup id={"farmer"} title={"Farmer Options"}>
                        {/* Farmer Title */}
                        <SettingsLabel>Farmer Title</SettingsLabel>
                        <Input
                          disabled={Boolean(import.meta.env.VITE_WHISKER)}
                          value={account.title}
                          onChange={(ev) =>
                            updateActiveAccount({ title: ev.target.value })
                          }
                          placeholder="Farmer Title"
                        />

                        {/* Preferred Theme */}
                        {!import.meta.env.VITE_WHISKER ? (
                          <>
                            <SettingsLabel>Preferred Theme</SettingsLabel>

                            <div className="grid grid-cols-3 gap-2">
                              {["system", "light", "dark"].map((theme) => (
                                <button
                                  onClick={() =>
                                    dispatchAndConfigureSettings("theme", theme)
                                  }
                                  key={theme}
                                  className={cn(
                                    settings.theme === theme
                                      ? "bg-blue-200 dark:bg-blue-800"
                                      : "bg-neutral-100 dark:bg-neutral-700",
                                    "p-2 rounded-lg",
                                    "flex gap-1 items-center justify-center",
                                    "uppercase"
                                  )}
                                >
                                  {theme}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : null}

                        {/* Farmer Mode */}
                        <SettingsLabel>Farmer Mode</SettingsLabel>

                        <div className="grid grid-cols-2 gap-2">
                          {["web", "session"].map((mode) => (
                            <button
                              onClick={() =>
                                dispatchAndConfigureSettings("farmerMode", mode)
                              }
                              key={mode}
                              disabled={
                                mode === "session" &&
                                telegramClient.hasSession === false
                              }
                              className={cn(
                                farmerMode === mode
                                  ? "bg-blue-200 dark:bg-blue-800"
                                  : "bg-neutral-100 dark:bg-neutral-700",
                                "disabled:opacity-60",
                                "p-2 rounded-lg",
                                "flex gap-1 items-center justify-center",
                                "uppercase"
                              )}
                            >
                              {mode === "web" ? (
                                <HiOutlineGlobeAlt className="size-4" />
                              ) : (
                                <HiBolt className="size-4" />
                              )}
                              {mode}
                            </button>
                          ))}
                        </div>

                        {/* Preferred Telegram Web Version */}
                        <SettingsLabel>
                          Preferred Telegram Web Version
                        </SettingsLabel>

                        <div className="grid grid-cols-2 gap-2">
                          {["k", "a"].map((version) => (
                            <button
                              onClick={() =>
                                dispatchAndConfigureSettings(
                                  "preferredTelegramWebVersion",
                                  version
                                )
                              }
                              key={version}
                              className={cn(
                                settings.preferredTelegramWebVersion === version
                                  ? "bg-blue-200 dark:bg-blue-800"
                                  : "bg-neutral-100 dark:bg-neutral-700",
                                "p-2 rounded-lg",
                                "flex gap-1 items-center justify-center"
                              )}
                            >
                              <img
                                src={
                                  version === "k"
                                    ? TelegramWebKIcon
                                    : TelegramWebAIcon
                                }
                                className="w-6 h-6"
                              />
                              {`Web-${version.toUpperCase()}`}
                            </button>
                          ))}
                        </div>

                        {/* Show User Info */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "displayUserInfo",
                              ev.target.checked
                            )
                          }
                          checked={settings?.displayUserInfo}
                        >
                          Display User Info
                        </LabelToggle>

                        {/* Show IP Address */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "displayIpAddress",
                              ev.target.checked
                            )
                          }
                          checked={settings?.displayIpAddress}
                        >
                          Display IP Address
                        </LabelToggle>

                        {/* (SHARED) - Show Mini-App Toolbar */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSharedSettings(
                              "showMiniAppToolbar",
                              ev.target.checked
                            )
                          }
                          checked={sharedSettings?.showMiniAppToolbar}
                        >
                          Show Mini-App Toolbar
                        </LabelToggle>
                      </SettingsGroup>

                      {/* Bot Options */}
                      <SettingsGroup id={"bot"} title={"Bot Options"}>
                        {/* Enable In-App Browser */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "enableInAppBrowser",
                              ev.target.checked
                            )
                          }
                          checked={settings?.enableInAppBrowser}
                        >
                          Enable In-App Browser
                        </LabelToggle>

                        {/* Mini-App in New Tab */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "miniAppInNewWindow",
                              ev.target.checked
                            )
                          }
                          checked={settings?.miniAppInNewWindow}
                        >
                          Mini-App in New Window
                        </LabelToggle>

                        {/* Auto-Start Bot */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "autoStartBot",
                              ev.target.checked
                            )
                          }
                          checked={settings?.autoStartBot}
                        >
                          Auto-Start Bot{" "}
                          <span className="text-orange-500">
                            (Session Mode)
                          </span>
                        </LabelToggle>

                        {/* Close Other Bots */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "closeOtherBots",
                              ev.target.checked
                            )
                          }
                          checked={settings?.closeOtherBots}
                        >
                          Close Other Bots
                        </LabelToggle>
                      </SettingsGroup>

                      {/* Cloud Options */}
                      <SettingsGroup id={"cloud"} title={"Cloud Options"}>
                        {/* Cloud */}
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "enableCloud",
                              ev.target.checked
                            )
                          }
                          checked={settings?.enableCloud}
                        >
                          <span className="flex flex-col">
                            <span>Enable Cloud</span>
                            <span className="text-orange-500">
                              (Access Required)
                            </span>
                          </span>
                        </LabelToggle>

                        {/* Cloud Server */}
                        <SettingsLabel>Cloud Server</SettingsLabel>
                        <div className="flex gap-2">
                          <Input
                            value={cloudServer}
                            onChange={(ev) => setCloudServer(ev.target.value)}
                            placeholder="Cloud Server"
                          />

                          {/* Reset Button */}
                          <ResetButton
                            onClick={() => setCloudServer(defaultCloudServer)}
                          />

                          {/* Set Button */}
                          <ConfirmButton onClick={handleSetCloudServer} />
                        </div>

                        {/* Share Cloud Proxy */}
                        <SettingsLabel>Cloud Proxy</SettingsLabel>
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "shareCloudProxy",
                              ev.target.checked
                            )
                          }
                          checked={settings?.shareCloudProxy}
                        >
                          Share Cloud Proxy
                        </LabelToggle>
                      </SettingsGroup>

                      {/* Seeker Options */}
                      <SettingsGroup id={"seeker"} title={"Seeker Options"}>
                        <Alert variant={"info"}>
                          Enable Seeker to update your Cloud Server Address
                          automatically.
                        </Alert>

                        {/* Cloud Seeker */}
                        <div className="flex gap-2">
                          <div className="min-w-0 min-h-0 grow">
                            <LabelToggle
                              onChange={(ev) =>
                                dispatchAndConfigureSettings(
                                  "enableSeeker",
                                  ev.target.checked
                                )
                              }
                              checked={settings?.enableSeeker}
                            >
                              <span className="flex flex-col">
                                <span>Enable Seeker</span>
                              </span>
                            </LabelToggle>
                          </div>

                          {/* Seekers */}
                          <button
                            onClick={() => tabs.dispatchAndSetValue("seeker")}
                            type="button"
                            className={cn(
                              "shrink-0",
                              "inline-flex items-center justify-center",
                              "px-4 rounded-lg shrink-0",
                              "bg-neutral-100 dark:bg-neutral-700"
                            )}
                          >
                            <HiOutlineListBullet className="w-4 h-4 " />
                          </button>
                        </div>

                        {/* Seeker Server */}
                        <SettingsLabel>Seeker Server</SettingsLabel>
                        <div className="flex gap-2">
                          <Input
                            value={seekerServer}
                            onChange={(ev) => setSeekerServer(ev.target.value)}
                            placeholder="Seeker Server"
                          />

                          {/* Reset Button */}
                          <ResetButton
                            onClick={() => setSeekerServer(defaultSeekerServer)}
                          />

                          {/* Set Button */}
                          <ConfirmButton onClick={handleSetSeekerServer} />
                        </div>
                      </SettingsGroup>

                      {/* Proxy Options */}
                      <SettingsGroup id={"proxy"} title={"Proxy Options"}>
                        {/* Enable Proxy */}
                        <LabelToggle
                          disabled={Boolean(import.meta.env.VITE_WHISKER)}
                          onChange={(ev) =>
                            configureSharedSettings(
                              "proxyEnabled",
                              ev.target.checked
                            )
                          }
                          checked={sharedSettings.proxyEnabled}
                        >
                          Enable Proxy
                        </LabelToggle>

                        <p className="text-neutral-500 dark:text-neutral-400">
                          To enable this option, first turn off proxy sharing in
                          Cloud options.
                        </p>

                        {/* Proxy Host */}
                        <SettingsLabel>Proxy Host</SettingsLabel>
                        <Input
                          disabled={Boolean(import.meta.env.VITE_WHISKER)}
                          value={sharedSettings.proxyHost}
                          onChange={(ev) =>
                            configureSharedSettings(
                              "proxyHost",
                              ev.target.value
                            )
                          }
                          placeholder="Proxy Host"
                        />

                        {/* Proxy Port */}
                        <SettingsLabel>Proxy Port</SettingsLabel>
                        <Input
                          disabled={Boolean(import.meta.env.VITE_WHISKER)}
                          value={sharedSettings.proxyPort}
                          onChange={(ev) =>
                            configureSharedSettings(
                              "proxyPort",
                              ev.target.value
                            )
                          }
                          placeholder="Proxy Port"
                        />

                        {/* Proxy Username */}
                        <SettingsLabel>Proxy Username</SettingsLabel>
                        <Input
                          disabled={Boolean(import.meta.env.VITE_WHISKER)}
                          value={sharedSettings.proxyUsername}
                          onChange={(ev) =>
                            configureSharedSettings(
                              "proxyUsername",
                              ev.target.value
                            )
                          }
                          placeholder="Proxy Username"
                        />

                        {/* Proxy Password */}
                        <SettingsLabel>Proxy Password</SettingsLabel>
                        <Input
                          disabled={Boolean(import.meta.env.VITE_WHISKER)}
                          value={sharedSettings.proxyPassword}
                          onChange={(ev) =>
                            configureSharedSettings(
                              "proxyPassword",
                              ev.target.value
                            )
                          }
                          placeholder="Proxy Password"
                        />
                      </SettingsGroup>

                      {!import.meta.env.VITE_WHISKER ? (
                        <>
                          {/* (SHARED) PC Options */}
                          <SettingsGroup id="pc" title="PC Options">
                            {/* Open Farmer in new Window */}
                            <LabelToggle
                              onChange={(ev) =>
                                dispatchAndConfigureSharedSettings(
                                  "openFarmerInNewWindow",
                                  ev.target.checked
                                )
                              }
                              checked={sharedSettings?.openFarmerInNewWindow}
                            >
                              Open Farmer in new Window
                            </LabelToggle>

                            {/* (SHARED) Open Farmer on StartUp */}
                            <LabelToggle
                              onChange={(ev) =>
                                dispatchAndConfigureSharedSettings(
                                  "openFarmerOnStartup",
                                  ev.target.checked
                                )
                              }
                              checked={sharedSettings?.openFarmerOnStartup}
                            >
                              Open Farmer on Startup
                            </LabelToggle>

                            {/* (SHARED) Close Main Window on Startup */}
                            <LabelToggle
                              onChange={(ev) =>
                                dispatchAndConfigureSharedSettings(
                                  "closeMainWindowOnStartup",
                                  ev.target.checked
                                )
                              }
                              checked={sharedSettings?.closeMainWindowOnStartup}
                            >
                              Close Main Window on Startup
                            </LabelToggle>
                          </SettingsGroup>
                        </>
                      ) : null}

                      {/* Mirror Options */}
                      <SettingsGroup id="mirror" title={"Mirror Options"}>
                        <LabelToggle
                          onChange={(ev) =>
                            dispatchAndConfigureSettings(
                              "enableMirror",
                              ev.target.checked
                            )
                          }
                          checked={settings?.enableMirror}
                        >
                          Enable Mirror
                        </LabelToggle>

                        {/* Mirror Server */}
                        <SettingsLabel>Mirror Server</SettingsLabel>
                        <div className="flex gap-2">
                          <Input
                            value={mirrorServer}
                            onChange={(ev) => setMirrorServer(ev.target.value)}
                            placeholder="Mirror Server"
                          />

                          {/* Reset Button */}
                          <ResetButton
                            onClick={() => setMirrorServer(defaultMirrorServer)}
                          />

                          {/* Set Button */}
                          <ConfirmButton onClick={handleSetMirrorServer} />
                        </div>

                        {!import.meta.env.VITE_WHISKER ? (
                          <>
                            {/* (SHARED) Farmers Per Windows */}
                            <label className="mt-4 text-neutral-400">
                              Farmers Per Window (Min - 3)
                            </label>
                            <div className="flex gap-2">
                              <Input
                                value={farmersPerWindow}
                                type="number"
                                onChange={(ev) =>
                                  setFarmersPerWindow(ev.target.value)
                                }
                                placeholder="Farmers Per Window"
                              />

                              {/* Set Button */}
                              <ConfirmButton
                                onClick={() =>
                                  dispatchAndSetFarmersPerWindow(
                                    farmersPerWindow
                                  )
                                }
                              />
                            </div>

                            {/* (SHARED) Farmer Postion */}
                            <SettingsLabel>Farmer Position</SettingsLabel>
                            <div className="flex gap-2">
                              <Input
                                value={farmerPosition}
                                type="number"
                                onChange={(ev) =>
                                  setFarmerPosition(ev.target.value)
                                }
                                placeholder="Farmer Position"
                              />

                              {/* Set Button */}
                              <ConfirmButton
                                onClick={handleSetFarmerPosition}
                              />
                            </div>
                          </>
                        ) : null}
                      </SettingsGroup>
                    </SettingsContainer>

                    {/* Force Reload Extension */}
                    <button
                      type="button"
                      title="Force Reload Extension"
                      onClick={() => dispatchAndReloadApp(true)}
                      className={cn(
                        "mt-1",
                        "bg-purple-100 ",
                        "text-purple-900",
                        "p-2.5 rounded-xl shrink-0 font-bold",
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      <TbProgressCheck className="w-4 h-4" /> Force Reload
                      Extension
                    </button>

                    {/* Restore Settings */}
                    <button
                      type="button"
                      title="Restore Default Settings"
                      onClick={() => dispatchAndRestoreSettings()}
                      className={cn(
                        "bg-orange-100",
                        "text-orange-900",
                        "p-2.5 rounded-xl shrink-0 font-bold",
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      <HiOutlineArrowPath className="w-4 h-4" /> Restore Default
                      Settings
                    </button>

                    {/* Remove Account */}
                    {farmerAccounts.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeActiveAccount()}
                        className={cn(
                          "bg-red-100 dark:bg-red-600",
                          "text-red-900 dark:text-red-100",
                          "p-2.5 rounded-xl shrink-0 font-bold",
                          "flex items-center justify-center gap-2"
                        )}
                      >
                        <PiTrashBold className="size-4" />
                        Remove Current Account
                      </button>
                    ) : null}
                  </form>
                </Tabs.Content>

                {/* Farmers Config */}
                <Tabs.Content value="farmers">
                  <div className="flex flex-col gap-2">
                    {/* Layout */}
                    <SettingsLabel>Layout</SettingsLabel>

                    <div className="grid grid-cols-2 gap-2">
                      {["grid", "list"].map((style) => (
                        <button
                          onClick={() =>
                            dispatchAndConfigureSettings("farmersLayout", style)
                          }
                          key={style}
                          className={cn(
                            settings.farmersLayout === style
                              ? "bg-blue-200 dark:bg-blue-800"
                              : "bg-neutral-100 dark:bg-neutral-700",
                            "p-2 rounded-lg",
                            "flex gap-1 items-center justify-center",
                            "uppercase"
                          )}
                        >
                          {style}
                        </button>
                      ))}
                    </div>

                    {/* Repeat Cycle */}
                    <LabelToggle
                      onChange={(ev) =>
                        dispatchAndConfigureSettings(
                          "uncappedPoints",
                          ev.target.checked
                        )
                      }
                      checked={settings?.uncappedPoints}
                    >
                      Uncapped Points{" "}
                      <HiOutlineExclamationTriangle className="inline w-4 h-4" />
                    </LabelToggle>

                    <Alert variant={"info"}>
                      Enable the farmers you would like to include.
                    </Alert>

                    <Reorder.Group
                      values={dropsOrder}
                      className="flex flex-col gap-2"
                      onReorder={(newOrder) =>
                        dispatchAndConfigureSettings(
                          "dropsOrder",
                          newOrder,
                          false
                        )
                      }
                    >
                      {orderedDrops.map((drop) => (
                        <DropReorderItem key={drop.id} value={drop.id}>
                          <LabelToggle
                            onChange={(ev) =>
                              toggleDrop(drop.id, ev.target.checked)
                            }
                            checked={dropsStatus[drop.id] === true}
                          >
                            <div className="flex items-center gap-1">
                              <span className="relative shrink-0">
                                <img
                                  src={drop.icon}
                                  className="w-6 h-6 rounded-full"
                                />
                                {drop.syncToCloud ? (
                                  <span
                                    className={cn(
                                      "absolute inset-0",
                                      "rotate-45",

                                      // After
                                      "after:absolute",
                                      "after:top-0 after:left-1/2",
                                      "after:-translate-x-1/2 after:-translate-y-1/2",
                                      "after:border-2 after:border-white",
                                      "after:w-2 after:h-2",
                                      "after:rounded-full",
                                      "after:bg-green-500"
                                    )}
                                  ></span>
                                ) : null}
                              </span>
                              <h5>{drop.title}</h5>
                            </div>
                          </LabelToggle>
                        </DropReorderItem>
                      ))}
                    </Reorder.Group>
                  </div>
                </Tabs.Content>

                {/* Seeker */}
                <Tabs.Content value="seeker">
                  <Seeker />
                </Tabs.Content>
              </Tabs>
            </div>
            <div className="flex gap-2 p-4 font-bold shrink-0">
              <Dialog.Close className="p-2.5 text-white bg-blue-500 rounded-xl grow">
                Close
              </Dialog.Close>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-w-0 min-h-0 grow">
            <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
});
