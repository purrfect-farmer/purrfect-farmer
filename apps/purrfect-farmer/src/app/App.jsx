import AppContext from "@/contexts/AppContext";
import AppUpdate from "@/components/AppUpdate";
import ControlArea from "@/partials/ControlArea";
import PWAUpdate from "@/components/PWAUpdate";
import TabButtonList from "@/components/TabButtonList";
import TabContent from "@/components/TabContent";
import useApp from "@/hooks/useApp";
import useCloudSessionCheck from "@/hooks/useCloudSessionCheck";
import useMiniAppToolbar from "@/hooks/useMiniAppToolbar";
import useProxy from "@/hooks/useProxy";
import useSeeker from "@/hooks/useSeeker";
import useWhiskerData from "@/hooks/useWhiskerData";
import { memo } from "react";

import Onboarding from "./Onboarding";

function App() {
  const app = useApp();
  const { settings } = app;
  const { onboarded } = settings;

  /** Proxy */
  useProxy(app);

  /** Whisker Data */
  useWhiskerData(app);

  /** Use Seeker */
  useSeeker(app);

  /** Check Cloud Telegram Session */
  useCloudSessionCheck(app);

  /** Use Toolbar */
  useMiniAppToolbar(app);

  return (
    <AppContext.Provider value={app}>
      {onboarded ? (
        <div className="flex flex-col h-dvh">
          {/* PWA Update */}
          {import.meta.env.VITE_PWA ? <PWAUpdate /> : <AppUpdate />}

          {/* Tab Button List */}
          <TabButtonList tabs={app.openedTabs} />

          {/* Tabs Contents Wrapper */}
          <div className="relative min-w-0 min-h-0 overflow-hidden grow">
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
      )}
    </AppContext.Provider>
  );
}

export default memo(App);
