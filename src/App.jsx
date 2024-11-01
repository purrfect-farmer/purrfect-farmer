import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";

import AppContext from "./contexts/AppContext";
import TabButtonList from "./components/TabButtonList";
import TabContent from "./components/TabContent";
import useApp from "./hooks/useApp";
import { resizeFarmerWindow } from "./lib/utils";
import ControlArea from "./ControlArea";

function App() {
  const app = useApp();
  const wakeLockRef = useRef(null);

  /** Resize window */
  useEffect(() => {
    (async function () {
      await resizeFarmerWindow();
    })();
  }, []);

  /** Acquire WakeLock */
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {}
    };

    const handleVisibilityChange = async () => {
      if (
        wakeLockRef.current !== null &&
        document.visibilityState === "visible"
      ) {
        await requestWakeLock();
      }
    };

    /** Watch Visibility Change */
    document.addEventListener("visibilitychange", handleVisibilityChange);

    /** Request initial WakeLock */
    requestWakeLock();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
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

        <ControlArea />
      </div>
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

export default App;
