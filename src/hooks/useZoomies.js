import farmerTabs from "@/farmerTabs";
import toast from "react-hot-toast";
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

  /** Process */
  const process = useProcessLock("app.zoomies", core.socket);

  /** Auth */
  const [auth, setAuth] = useState(false);

  /** Current State */
  const [current, setCurrent] = useState({
    drop: drops[INITIAL_POSITION],
    task: drops[INITIAL_POSITION]?.tasks?.[0],
  });

  /** Reset Zoomies */
  const resetZoomies = useCallback(() => {
    /** Reset Auth */
    setAuth(false);

    /** Reset Tabs */
    core.resetTabs();

    /** Set Active Tab */
    if (current.drop) {
      core.setActiveTab(current.drop.id);
    }
  }, [current.drop, setAuth, core.resetTabs, core.setActiveTab]);

  /** Skip to Next Drop */
  const skipToNextDrop = useCallback(() => {
    setCurrent((prev) => {
      const drop = drops[(drops.indexOf(prev.drop) + 1) % drops.length];
      return {
        drop,
        task: drop?.tasks?.[0],
      };
    });
  }, [drops, setCurrent]);

  /** Process the next task */
  const processNextTask = useCallback(() => {
    if (process.started) {
      setCurrent((prev) => {
        if (prev.task === prev.drop?.tasks?.at(-1)) {
          const drop = drops[(drops.indexOf(prev.drop) + 1) % drops.length];

          return {
            drop,
            task: drop?.tasks?.[0],
          };
        } else {
          const tasks = prev.drop.tasks;

          return {
            ...prev,
            task: tasks[(tasks.indexOf(prev.task) + 1) % tasks.length],
          };
        }
      });
    }
  }, [process.started, drops, setCurrent]);

  /** Reset Zoomies */
  useEffect(() => {
    if (process.started && current.drop) {
      resetZoomies();
    }
  }, [process.started, current.drop]);

  /** Open Bot */
  useEffect(() => {
    if (process.started && current.drop && !auth) {
      /** Open Bot */
      const openBot = () => {
        core.setActiveTab(current.drop?.id);
        core.openTelegramLink(current.drop.telegramLink);
      };

      /** First Time */
      openBot();

      /** Interval */
      const interval = setInterval(openBot, 60000);

      /** Clear Interval */
      return () => {
        clearInterval(interval);
      };
    }
  }, [process.started, auth, current.drop]);

  /** Handle Auth */
  useEffect(() => {
    if (!process.started) return;

    if (auth) {
      /** Close Telegram Web */
      core.closeTab("telegram-web-k");

      /** Set Active Tab */
      if (current.drop) {
        core.setActiveTab(current.drop.id);
      }
    }
  }, [process.started, auth, current.drop, core.closeTab, core.setActiveTab]);

  /** Reset the drops */
  useEffect(() => {
    /** Stop the Process */
    process.stop();

    /** Update current drop */
    setCurrent((prev) => {
      if (drops.includes(prev.drop)) {
        return prev;
      } else {
        return {
          drop: drops[0],
          task: drops[0]?.tasks?.[0],
        };
      }
    });
  }, [drops, setCurrent, process.stop]);

  /** Stop When There's no Drop */
  useEffect(() => {
    if (process.started && !current.drop) {
      process.stop();
      toast.error("No Farmer enabled in the Zoomies");
    }
  }, [process.started, process.stop, current.drop]);

  return useValuesMemo({
    drops,
    enabled: process.started,
    toggle: process.toggle,
    dispatchAndToggle: process.dispatchAndToggle,
    current,
    setAuth,
    setCurrent,
    skipToNextDrop,
    processNextTask,
  });
}
