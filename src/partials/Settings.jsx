import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import ResetButton from "@/components/ResetButton";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import defaultSettings from "@/core/defaultSettings";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { CgSpinner } from "react-icons/cg";
import {
  HiBolt,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineGlobeAlt,
  HiOutlineListBullet,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { Reorder, useDragControls } from "motion/react";
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

export default memo(function Settings({ tabs }) {
  const {
    settings,
    configureSettings,
    dispatchAndRestoreSettings,
    dispatchAndConfigureSettings,
    dropsStatus,
    dropsOrder,
    orderedDrops,
  } = useAppContext();

  /** Mirror Server */
  const [mirrorServer, setMirrorServer] = useState(
    settings.mirrorServer || defaultSettings.mirrorServer
  );

  /** Cloud Server */
  const [cloudServer, setCloudServer] = useState(
    settings.cloudServer || defaultSettings.cloudServer
  );

  /** Seeker Server */
  const [seekerServer, setSeekerServer] = useState(
    settings.seekerServer || defaultSettings.seekerServer
  );

  /** Farmers Per Window */
  const [farmersPerWindow, setFarmersPerWindow] = useState(
    settings.farmersPerWindow || defaultSettings.farmersPerWindow
  );

  /** Farmer Position */
  const [farmerPosition, setFarmerPosition] = useState(
    settings.farmerPosition || defaultSettings.farmerPosition
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

  /** Set Farmers Per Window */
  const [, dispatchAndSetFarmersPerWindow] = useMirroredCallback(
    "settings.farmers-per-window",
    (amount) => {
      /** Store Settings */
      configureSettings("farmersPerWindow", Math.max(3, Number(amount)));

      /** Resize Page */
      resizeSettingsPage();
    },
    [configureSettings, resizeSettingsPage]
  );

  /** Set Farmer Position */
  const handleSetFarmerPosition = useCallback(() => {
    configureSettings(
      "farmerPosition",
      Math.max(1, Math.min(farmersPerWindow, Number(farmerPosition) || 1))
    );

    resizeSettingsPage();
  }, [resizeSettingsPage, farmersPerWindow, farmerPosition, configureSettings]);

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
    setMirrorServer(settings.mirrorServer || defaultSettings.mirrorServer);

    /** Set Cloud Server */
    setCloudServer(settings.cloudServer || defaultSettings.cloudServer);

    /** Set Seeker Server */
    setSeekerServer(settings.seekerServer || defaultSettings.seekerServer);

    /** Set Farmers Per Window */
    setFarmersPerWindow(
      settings.farmersPerWindow || defaultSettings.farmersPerWindow
    );

    /** Set Farmer Position */
    setFarmerPosition(
      settings.farmerPosition || defaultSettings.farmerPosition
    );
  }, [
    /** Deps */
    settings,
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

              <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
                <Tabs.List className="grid grid-cols-3">
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
                <Tabs.Content value="settings">
                  <form
                    onSubmit={(ev) => ev.preventDefault()}
                    className="flex flex-col gap-2"
                  >
                    {/* Farmer Title */}
                    <label className="text-neutral-400">Farmer Title</label>
                    <Input
                      value={settings?.farmerTitle}
                      onChange={(ev) =>
                        configureSettings("farmerTitle", ev.target.value, false)
                      }
                      placeholder="Farmer Title"
                    />

                    {/* Preferred Theme */}
                    <label className="text-neutral-400">Preferred Theme</label>

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

                    {/* Farmer Mode */}
                    <label className="text-neutral-400">Farmer Mode</label>

                    <div className="grid grid-cols-2 gap-2">
                      {["web", "session"].map((farmerMode) => (
                        <button
                          onClick={() =>
                            dispatchAndConfigureSettings(
                              "farmerMode",
                              farmerMode
                            )
                          }
                          key={farmerMode}
                          className={cn(
                            settings.farmerMode === farmerMode
                              ? "bg-blue-200 dark:bg-blue-800"
                              : "bg-neutral-100 dark:bg-neutral-700",
                            "p-2 rounded-lg",
                            "flex gap-1 items-center justify-center",
                            "uppercase"
                          )}
                        >
                          {farmerMode === "web" ? (
                            <HiOutlineGlobeAlt className="size-4" />
                          ) : (
                            <HiBolt className="size-4" />
                          )}
                          {farmerMode}
                        </button>
                      ))}
                    </div>

                    {/* Preferred Telegram Web Version */}
                    <label className="text-neutral-400">
                      Preferred Telegram Web Version
                    </label>

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

                    {/* Show Mini-App Toolbar */}
                    <LabelToggle
                      onChange={(ev) =>
                        dispatchAndConfigureSettings(
                          "showMiniAppToolbar",
                          ev.target.checked
                        )
                      }
                      checked={settings?.showMiniAppToolbar}
                    >
                      Show Mini-App Toolbar
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

                    {/* Cloud Options */}
                    <h4 className="mt-4 text-neutral-400">Cloud Options</h4>

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
                    <label className="text-neutral-400">Cloud Server</label>
                    <div className="flex gap-2">
                      <Input
                        value={cloudServer}
                        onChange={(ev) => setCloudServer(ev.target.value)}
                        placeholder="Cloud Server"
                      />

                      {/* Reset Button */}
                      <ResetButton
                        onClick={() =>
                          setCloudServer(defaultSettings.cloudServer)
                        }
                      />

                      {/* Set Button */}
                      <ConfirmButton onClick={handleSetCloudServer} />
                    </div>

                    {/* Seeker Options */}
                    <h4 className="mt-4 text-neutral-400">Seeker Options</h4>

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

                    <p
                      className={cn(
                        "bg-blue-100 text-blue-800 dark:text-blue-900 p-4 text-center rounded-lg"
                      )}
                    >
                      Enable Seeker to update your Cloud Server Address
                      automatically.
                    </p>

                    {/* Seeker Server */}
                    <label className="text-neutral-400">Seeker Server</label>
                    <div className="flex gap-2">
                      <Input
                        value={seekerServer}
                        onChange={(ev) => setSeekerServer(ev.target.value)}
                        placeholder="Seeker Server"
                      />

                      {/* Reset Button */}
                      <ResetButton
                        onClick={() =>
                          setSeekerServer(defaultSettings.seekerServer)
                        }
                      />

                      {/* Set Button */}
                      <ConfirmButton onClick={handleSetSeekerServer} />
                    </div>

                    {/* PC Options */}
                    <h4 className="mt-4 text-neutral-400">PC Options</h4>

                    {/* Open Farmer in new Window */}
                    <LabelToggle
                      onChange={(ev) =>
                        dispatchAndConfigureSettings(
                          "openFarmerInNewWindow",
                          ev.target.checked
                        )
                      }
                      checked={settings?.openFarmerInNewWindow}
                    >
                      Open Farmer in new Window
                    </LabelToggle>

                    {/* Open Farmer on StartUp */}
                    <LabelToggle
                      onChange={(ev) =>
                        dispatchAndConfigureSettings(
                          "openFarmerOnStartup",
                          ev.target.checked
                        )
                      }
                      checked={settings?.openFarmerOnStartup}
                    >
                      Open Farmer on Startup
                    </LabelToggle>

                    {/* Close Main Window on Startup */}
                    <LabelToggle
                      onChange={(ev) =>
                        dispatchAndConfigureSettings(
                          "closeMainWindowOnStartup",
                          ev.target.checked
                        )
                      }
                      checked={settings?.closeMainWindowOnStartup}
                    >
                      Close Main Window on Startup
                    </LabelToggle>

                    {/* Mirror Options */}
                    <h4 className="mt-4 text-neutral-400">Mirror Options</h4>
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
                    <label className="text-neutral-400">Mirror Server</label>
                    <div className="flex gap-2">
                      <Input
                        value={mirrorServer}
                        onChange={(ev) => setMirrorServer(ev.target.value)}
                        placeholder="Mirror Server"
                      />

                      {/* Reset Button */}
                      <ResetButton
                        onClick={() =>
                          setMirrorServer(defaultSettings.mirrorServer)
                        }
                      />

                      {/* Set Button */}
                      <ConfirmButton onClick={handleSetMirrorServer} />
                    </div>

                    {/* Farmers Per Windows */}
                    <label className="mt-4 text-neutral-400">
                      Farmers Per Window (Min - 3)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={farmersPerWindow}
                        type="number"
                        onChange={(ev) => setFarmersPerWindow(ev.target.value)}
                        placeholder="Farmers Per Window"
                      />

                      {/* Set Button */}
                      <ConfirmButton
                        onClick={() =>
                          dispatchAndSetFarmersPerWindow(farmersPerWindow)
                        }
                      />
                    </div>

                    {/* Farmer Postion */}
                    <label className="text-neutral-400">Farmer Position</label>
                    <div className="flex gap-2">
                      <Input
                        value={farmerPosition}
                        type="number"
                        onChange={(ev) => setFarmerPosition(ev.target.value)}
                        placeholder="Farmer Position"
                      />

                      {/* Set Button */}
                      <ConfirmButton onClick={handleSetFarmerPosition} />
                    </div>
                  </form>
                </Tabs.Content>

                {/* Farmers Config */}
                <Tabs.Content value="farmers">
                  <div className="flex flex-col gap-2">
                    {/* Layout */}
                    <label className="text-neutral-400">Layout</label>

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
                          "repeatZoomiesCycle",
                          ev.target.checked
                        )
                      }
                      checked={settings?.repeatZoomiesCycle}
                    >
                      Repeat Zoomies Cycle
                    </LabelToggle>

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

                    <p
                      className={cn(
                        "bg-blue-100 text-blue-800 dark:text-blue-900",
                        "p-4 text-center rounded-lg"
                      )}
                    >
                      Enable the farmers you would like to include.
                    </p>

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
              </Tabs.Root>
            </div>
            <div className="flex gap-2 p-4 font-bold shrink-0">
              <button
                title="Restore Default Settings"
                onClick={() => dispatchAndRestoreSettings()}
                className={cn(
                  "bg-blue-100 dark:bg-blue-900",
                  "text-blue-900 dark:text-blue-100",
                  "p-2.5 rounded-xl shrink-0"
                )}
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>
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
