import AppContext from "@/contexts/AppContext";
import ControlArea from "@/partials/ControlArea";
import FullSpinner from "@/components/FullSpinner";
import PrimaryButton from "@/components/PrimaryButton";
import TabButtonList from "@/components/TabButtonList";
import TabContent from "@/components/TabContent";
import useApp from "@/hooks/useApp";
import useCloudSessionCheck from "@/hooks/useCloudSessionCheck";
import useDynamicRules from "@/hooks/useDynamicRules";
import useMiniAppToolbar from "@/hooks/useMiniAppToolbar";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useSeeker from "@/hooks/useSeeker";
import useTelegramWebAppEvents from "@/hooks/useTelegramWebAppEvents";
import useTheme from "@/hooks/useTheme";
import useWakeLock from "@/hooks/useWakeLock";
import { Toaster } from "react-hot-toast";
import { memo } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

import Onboarding from "./Onboarding";

function App() {
  const app = useApp();
  const hasRestoredSettings = app.hasRestoredSettings;
  const theme = app.settings.theme;
  const onboarded = app.settings.onboarded;

  /** Service Worker */
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  /** Dispatch and Update Service Worker */
  const [, dispatchAndUpdateServiceWorker] = useMirroredCallback(
    "app.update-service-worker",
    () => {
      if (needRefresh) {
        updateServiceWorker(true);
      }
    },
    [needRefresh, updateServiceWorker],
    app.mirror
  );

  /** Use Dynamic Rules */
  useDynamicRules();

  /** Use Seeker */
  useSeeker(app);

  /** Check Cloud Telegram Session */
  useCloudSessionCheck(app);

  /** Use Toolbar */
  useMiniAppToolbar(app);

  /** Use TelegramWebApp Events */
  useTelegramWebAppEvents(app);

  /** Apply Theme */
  useTheme(theme);

  /** Acquire WakeLock */
  useWakeLock();

  return (
    <AppContext.Provider value={app}>
      {hasRestoredSettings ? (
        onboarded ? (
          <div className="flex flex-col h-dvh">
            {needRefresh ? (
              <PrimaryButton
                className="bg-orange-500 rounded-none"
                onClick={() => dispatchAndUpdateServiceWorker()}
              >
                Click to Update
              </PrimaryButton>
            ) : null}
            {app.openedTabs.length > 1 ? (
              <TabButtonList tabs={app.openedTabs} />
            ) : null}

            {/* Tabs Contents Wrapper */}
            <div className="relative min-w-0 min-h-0 overflow-auto grow">
              {app.openedTabs.map((tab) => (
                <TabContent
                  key={tab.reloadedAt ? `${tab.id}-${tab.reloadedAt}` : tab.id}
                  tab={tab}
                />
              ))}
            </div>

            <ControlArea />
          </div>
        ) : (
          <Onboarding />
        )
      ) : (
        <div className="flex flex-col h-dvh">
          <FullSpinner />
        </div>
      )}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          loading: {
            duration: Infinity,
          },
        }}
      />
    </AppContext.Provider>
  );
}

export default memo(App);
