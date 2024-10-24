import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

import AppContext from "./contexts/AppContext";
import SyncControl from "./partials/SyncControl";
import TabButtonList from "./components/TabButtonList";
import TabContent from "./components/TabContent";
import useApp from "./hooks/useApp";
import { resizeFarmerWindow } from "./lib/utils";

function App() {
  const app = useApp();

  /** Resize window */
  useEffect(() => {
    (async function () {
      await resizeFarmerWindow();
    })();
  }, []);

  return (
    <AppContext.Provider value={app}>
      <div className="flex flex-col h-dvh">
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

        <SyncControl />
      </div>
      <Toaster position="top-center" />
    </AppContext.Provider>
  );
}

export default App;
