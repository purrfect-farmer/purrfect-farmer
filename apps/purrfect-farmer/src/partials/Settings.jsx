import Tabs from "@/components/Tabs";
import defaultSettings from "@/core/defaultSettings";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useMirroredState from "@/hooks/useMirroredState";
import { CgSpinner } from "react-icons/cg";
import { Dialog } from "radix-ui";
import { cn, resizeFarmerWindow } from "@/lib/utils";
import { memo, useCallback } from "react";

import Seeker from "./Seeker";
import BotOptionsGroup from "./Settings/BotOptionsGroup";
import CloudOptionsGroup from "./Settings/CloudOptionsGroup";
import FarmerOptionsGroup from "./Settings/FarmerOptionsGroup";
import FarmersConfigTab from "./Settings/FarmersConfigTab";
import MirrorOptionsGroup from "./Settings/MirrorOptionsGroup";
import PCOptionsGroup from "./Settings/PCOptionsGroup";
import ProxyOptionsGroup from "./Settings/ProxyOptionsGroup";
import SeekerOptionsGroup from "./Settings/SeekerOptionsGroup";
import SettingsActions from "./Settings/SettingsActions";
import { SettingsContainer } from "./Settings/SettingsComponents";
import defaultSharedSettings from "@/core/defaultSharedSettings";

export default memo(function Settings({ tabs }) {
  const {
    account,
    accounts: farmerAccounts,
    updateActiveAccount,
    farmerMode,
    telegramClient,
    settings,
    sharedSettings,
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

  const [settingsContainerValue, , dispatchAndSetSettingsContainerValue] =
    useMirroredState("settings-container", "farmer");

  /** Resize Page */
  const resizeSettingsPage = useCallback(async () => {
    await resizeFarmerWindow();
  }, []);

  /** Set Farmers Per Window */
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

  /** Set Farmer Position */
  const configureFarmerPosition = useCallback(
    (farmerPosition) => {
      configureSharedSettings(
        "farmerPosition",
        Math.max(
          1,
          Math.min(sharedSettings.farmersPerWindow, Number(farmerPosition) || 1)
        )
      );

      resizeSettingsPage();
    },
    [
      resizeSettingsPage,
      configureSharedSettings,
      sharedSettings.farmersPerWindow,
    ]
  );

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
                    <SettingsContainer
                      value={settingsContainerValue}
                      onValueChange={dispatchAndSetSettingsContainerValue}
                    >
                      <FarmerOptionsGroup
                        account={account}
                        settings={settings}
                        sharedSettings={sharedSettings}
                        farmerMode={farmerMode}
                        telegramClient={telegramClient}
                        updateActiveAccount={updateActiveAccount}
                        dispatchAndConfigureSettings={
                          dispatchAndConfigureSettings
                        }
                        dispatchAndConfigureSharedSettings={
                          dispatchAndConfigureSharedSettings
                        }
                      />

                      <BotOptionsGroup
                        settings={settings}
                        dispatchAndConfigureSettings={
                          dispatchAndConfigureSettings
                        }
                      />

                      <CloudOptionsGroup
                        settings={settings}
                        defaultSettings={defaultSettings}
                        dispatchAndConfigureSettings={
                          dispatchAndConfigureSettings
                        }
                      />

                      <SeekerOptionsGroup
                        tabs={tabs}
                        settings={settings}
                        defaultSettings={defaultSettings}
                        dispatchAndConfigureSettings={
                          dispatchAndConfigureSettings
                        }
                      />

                      <ProxyOptionsGroup
                        sharedSettings={sharedSettings}
                        configureSharedSettings={configureSharedSettings}
                      />

                      <PCOptionsGroup
                        sharedSettings={sharedSettings}
                        dispatchAndConfigureSharedSettings={
                          dispatchAndConfigureSharedSettings
                        }
                      />

                      <MirrorOptionsGroup
                        sharedSettings={sharedSettings}
                        defaultSharedSettings={defaultSharedSettings}
                        configureFarmerPosition={configureFarmerPosition}
                        dispatchAndSetFarmersPerWindow={
                          dispatchAndSetFarmersPerWindow
                        }
                        dispatchAndConfigureSharedSettings={
                          dispatchAndConfigureSharedSettings
                        }
                      />
                    </SettingsContainer>

                    <SettingsActions
                      farmerAccountsLength={farmerAccounts.length}
                      dispatchAndReloadApp={dispatchAndReloadApp}
                      dispatchAndRestoreSettings={dispatchAndRestoreSettings}
                      removeActiveAccount={removeActiveAccount}
                    />
                  </form>
                </Tabs.Content>

                {/* Farmers Config */}
                <Tabs.Content value="farmers">
                  <FarmersConfigTab
                    settings={settings}
                    dropsStatus={dropsStatus}
                    dropsOrder={dropsOrder}
                    orderedDrops={orderedDrops}
                    dispatchAndConfigureSettings={dispatchAndConfigureSettings}
                    toggleDrop={toggleDrop}
                  />
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
