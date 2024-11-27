import { Toaster } from "react-hot-toast";
import { useEffect, useRef } from "react";

import AppContext from "./contexts/AppContext";
import ControlArea from "./ControlArea";
import TabButtonList from "./components/TabButtonList";
import TabContent from "./components/TabContent";
import useApp from "./hooks/useApp";
import { resizeFarmerWindow } from "./lib/utils";
import { useMedia } from "react-use";

function App() {
  const app = useApp();
  const theme = app.settings.theme;
  const wakeLockRef = useRef(null);
  const systemIsDark = useMedia("(prefers-color-scheme: dark)");

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

  /** Apply Theme */
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark" || (theme === "system" && systemIsDark)
    );
  }, [theme, systemIsDark]);

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
