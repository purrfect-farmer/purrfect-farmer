import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import ResetButton from "@/components/ResetButton";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import defaultSettings from "@/defaultSettings";
import useAppContext from "@/hooks/useAppContext";
import useSocketTabs from "@/hooks/useSocketTabs";
import { CgSpinner } from "react-icons/cg";
import { cn, maximizeFarmerWindow, resizeFarmerWindow } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function Settings() {
  const { settings, configureSettings, dispatchAndConfigureSettings, drops } =
    useAppContext();

  const tabs = useSocketTabs("app.settings-tabs", "settings");

  /** Sync Server */
  const [syncServer, setSyncServer] = useState(
    settings.syncServer || defaultSettings.syncServer
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
  const resizeSettingsPage = useCallback(() => {
    const handleOnBoundsChanged = () => {
      chrome.windows.onBoundsChanged.removeListener(handleOnBoundsChanged);
      resizeFarmerWindow();
    };

    chrome.windows.onBoundsChanged.addListener(handleOnBoundsChanged);
    maximizeFarmerWindow();
  }, []);

  /** Handle Set Sync Server */
  const handleSetSyncServer = useCallback(() => {
    dispatchAndConfigureSettings("syncServer", syncServer);
  }, [syncServer, dispatchAndConfigureSettings]);

  /** Set Farmers Per Window */
  const handleSetFarmersPerWindow = useCallback(() => {
    dispatchAndConfigureSettings(
      "farmersPerWindow",
      Math.max(3, Number(farmersPerWindow))
    );

    resizeSettingsPage();
  }, [resizeSettingsPage, farmersPerWindow, dispatchAndConfigureSettings]);

  /** Set Farmer Position */
  const handleSetFarmerPosition = useCallback(() => {
    configureSettings(
      "farmerPosition",
      Math.max(1, Math.min(farmersPerWindow, Number(farmerPosition) || 1))
    );

    resizeSettingsPage();
  }, [resizeSettingsPage, farmersPerWindow, farmerPosition, configureSettings]);

  /** Toggle Zoomies */
  const toggleZoomies = useCallback(
    (id, enabled) => {
      let entries = new Set([...settings.zoomies, id]);

      if (!enabled) {
        entries.delete(id);
      }

      dispatchAndConfigureSettings("zoomies", entries.values().toArray());
    },
    [settings.zoomies, dispatchAndConfigureSettings]
  );

  /** Update Settings */
  useEffect(() => {
    /** Set Sync Server */
    setSyncServer(settings.syncServer || defaultSettings.syncServer);

    /** Set Farmers Per Window */
    setFarmersPerWindow(
      settings.farmersPerWindow || defaultSettings.farmersPerWindow
    );

    /** Set Farmer Position */
    setFarmerPosition(
      settings.farmerPosition || defaultSettings.farmerPosition
    );
  }, [settings, setSyncServer, setFarmersPerWindow, setFarmerPosition]);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        className={cn(
          "fixed z-50 inset-x-0 bottom-0 flex flex-col bg-white h-3/4 rounded-t-xl",
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
                    "bg-gradient-to-r from-pink-500 to-violet-500"
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
                    "bg-gradient-to-r from-green-500 to-blue-500"
                  )}
                >
                  Configure the Farmer
                </span>
              </Dialog.Description>

              <Tabs.Root {...tabs.root} className="flex flex-col gap-4">
                <Tabs.List className="grid grid-cols-2">
                  {["settings", "zoomies"].map((value, index) => (
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
                    className="flex flex-col gap-2 py-4"
                  >
                    {/* Farmer Title */}
                    <label className="text-neutral-500">Farmer Title</label>
                    <Input
                      value={settings?.farmerTitle}
                      onChange={(ev) =>
                        configureSettings("farmerTitle", ev.target.value)
                      }
                      placeholder="Farmer Title"
                    />

                    {/* Open Telegram Web within the Farmer */}
                    <LabelToggle
                      onChange={(ev) =>
                        dispatchAndConfigureSettings(
                          "openTelegramWebWithinFarmer",
                          ev.target.checked
                        )
                      }
                      checked={settings?.openTelegramWebWithinFarmer}
                    >
                      Launch Telegram Web within the Farmer
                    </LabelToggle>

                    {/* Preferred Telegram Web Version */}
                    <label className="text-neutral-500">
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
                              ? "bg-blue-200"
                              : "bg-neutral-100",
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

                    {/* Sync Server */}
                    <label className="text-neutral-500">Sync Server</label>
                    <div className="flex gap-2">
                      <Input
                        value={syncServer}
                        onChange={(ev) => setSyncServer(ev.target.value)}
                        placeholder="Sync Server"
                      />

                      {/* Reset Button */}
                      <ResetButton
                        onClick={() =>
                          setSyncServer(defaultSettings.syncServer)
                        }
                      />

                      {/* Set Button */}
                      <ConfirmButton onClick={handleSetSyncServer} />
                    </div>

                    {/* PC Options */}
                    <h4 className="mt-4 text-neutral-500">PC Options</h4>

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

                    {/* Farmers Per Windows */}
                    <label className="text-neutral-500">
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
                      <ConfirmButton onClick={handleSetFarmersPerWindow} />
                    </div>

                    {/* Farmer Postion */}
                    <label className="text-neutral-500">Farmer Position</label>
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

                <Tabs.Content value="zoomies">
                  <div className="flex flex-col gap-2">
                    <p className="p-4 text-center text-blue-800 bg-blue-100 rounded-lg">
                      Enable the farmers you would like to include in the
                      Zoomies
                    </p>

                    {drops.map((drop) => (
                      <LabelToggle
                        onChange={(ev) =>
                          toggleZoomies(drop.id, ev.target.checked)
                        }
                        checked={settings?.zoomies.includes(drop.id)}
                      >
                        <div className="flex items-center gap-1">
                          <img
                            src={drop.icon}
                            className="w-6 h-6 rounded-full"
                          />
                          <h5>{drop.title}</h5>
                        </div>
                      </LabelToggle>
                    ))}
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            </div>
            <div className="flex flex-col p-4 font-bold shrink-0">
              <Dialog.Close className="p-2.5 text-white bg-blue-500 rounded-xl">
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
}
