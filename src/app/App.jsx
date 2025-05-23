import AppContext from "@/contexts/AppContext";
import ControlArea from "@/partials/ControlArea";
import FullSpinner from "@/components/FullSpinner";
import PrimaryButton from "@/components/PrimaryButton";
import TabButtonList from "@/components/TabButtonList";
import TabContent from "@/components/TabContent";
import useApp from "@/hooks/useApp";
import useCloudSessionCheck from "@/hooks/useCloudSessionCheck";
import useMiniAppToolbar from "@/hooks/useMiniAppToolbar";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useSeeker from "@/hooks/useSeeker";
import useTheme from "@/hooks/useTheme";
import useWhiskerData from "@/hooks/useWhiskerData";
import { memo } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

import Onboarding from "./Onboarding";

function App() {
  const app = useApp();
  const hasRestoredSettings = app.hasRestoredSettings;
  const { account, settings } = app;
  const { theme, onboarded } = settings;

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

  /** Whisker Data */
  useWhiskerData(app);

  /** Use Seeker */
  useSeeker(app);

  /** Check Cloud Telegram Session */
  useCloudSessionCheck(app);

  /** Use Toolbar */
  useMiniAppToolbar(app);

  /** Apply Theme */
  useTheme(theme, account.active);

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
            <TabButtonList tabs={app.openedTabs} />

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
    </AppContext.Provider>
  );
}

export default memo(App);
