import farmerTabs from "@/farmerTabs";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useProcessLock from "./useProcessLock";
import useValuesMemo from "./useValuesMemo";

const INITIAL_POSITION = 0;

export default function useZoomies(core) {
  /** Drops List */
  const drops = useMemo(
    () => farmerTabs.filter((item) => core.settings.zoomies.includes(item.id)),
    [farmerTabs, core.settings.zoomies]
  );

  const process = useProcessLock("app.zoomies", core.socket);
  const [auth, setAuth] = useState(false);

  /** PATCH */
  const [currentPosition, setCurrentPosition] = useState(INITIAL_POSITION);
  const [currentTask, setCurrentTask] = useState(null);
  const currentDrop = drops[currentPosition];

  const resetZoomies = useCallback(() => {
    setAuth(false);
    core.resetTabs();
    if (currentDrop) {
      core.setActiveTab(currentDrop.id);
    }
  }, [currentDrop, setAuth, core.resetTabs, core.setActiveTab]);

  const closeTelegramWeb = useCallback(() => {
    core.closeTab("telegram-web-k");
  }, [core.closeTab]);

  const processNextDrop = useCallback(() => {
    /** Reset Task */
    setCurrentTask(null);

    if (currentDrop === drops.at(-1)) {
      setCurrentPosition(0);

      if (drops.length === 1) {
        core.resetTabs();
        core.setActiveTab(drops[0].id);
        setAuth(false);
      }
    } else {
      setCurrentPosition((prev) => prev + 1);
    }
  }, [
    drops,
    currentDrop,
    setAuth,
    setCurrentTask,
    setCurrentPosition,
    core.resetTabs,
    core.setActiveTab,
  ]);

  /** Reset Zoomies */
  useEffect(() => {
    if (process.started) {
      resetZoomies();
    }
  }, [process.started, currentPosition]);

  /** Open Bot */
  useEffect(() => {
    let interval;
    if (process.started && !auth) {
      core.openTelegramLink(currentDrop.telegramLink);

      interval = setInterval(() => {
        core.openTelegramLink(currentDrop.telegramLink);
      }, 60000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [process.started, auth, currentDrop]);

  /** Handle Auth */
  useEffect(() => {
    if (!process.started) return;

    if (auth) {
      core.closeTab("telegram-web-k");
      if (currentDrop) {
        core.setActiveTab(currentDrop.id);
      }
    }
  }, [process.started, auth, currentDrop, core.closeTab, core.setActiveTab]);

  return useValuesMemo({
    enabled: process.started,
    toggle: process.toggle,
    dispatchAndToggle: process.dispatchAndToggle,
    currentPosition,
    currentDrop,
    currentTask,
    setAuth,
    setCurrentTask,
    processNextDrop,
    closeTelegramWeb,
  });
}
