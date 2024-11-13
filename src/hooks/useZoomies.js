import defaultZoomiesState from "@/defaultZoomiesState";
import farmerTabs from "@/farmerTabs";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useProcessLock from "./useProcessLock";
import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

const INITIAL_POSITION = 0;

export default function useZoomies(core) {
  const {
    value: zoomiesState,
    hasRestoredValue: hasRestoredZoomiesState,
    storeValue: storeZoomiesState,
  } = useStorageState("zoomiesState", defaultZoomiesState);

  /** Drops To Enable */
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

    /** Close Farmer Tabs */
    core.closeFarmerTabs();

    /** Set Active Tab */
    if (current.drop) {
      core.setActiveTab(current.drop.id);
    }
  }, [current.drop, setAuth, core.closeFarmerTabs, core.setActiveTab]);

  /** Refresh Zoomies */
  const refresh = useCallback(() => {
    setCurrent(() => {
      return {
        drop: drops[INITIAL_POSITION],
        task: drops[INITIAL_POSITION]?.tasks?.[0],
      };
    });
  }, [drops, setCurrent]);

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

  /** Process task Offset */
  const processTaskOffset = useCallback(
    (direction) => {
      if (process.started) {
        setCurrent((prev) => {
          if (prev.task === prev.drop?.tasks?.at(direction === 1 ? -1 : 0)) {
            const index = (drops.indexOf(prev.drop) + direction) % drops.length;
            const drop = drops.at(index);
            const task = drop?.tasks?.at(direction === 1 ? 0 : -1);
            return {
              drop,
              task,
            };
          } else {
            const tasks = prev.drop.tasks;
            const index = (tasks.indexOf(prev.task) + direction) % tasks.length;

            return {
              ...prev,
              task: tasks.at(index),
            };
          }
        });
      }
    },
    [process.started, drops, setCurrent]
  );

  /** Process the next task */
  const processPreviousTask = useCallback(
    () => processTaskOffset(-1),
    [processTaskOffset]
  );

  /** Process the next task */
  const processNextTask = useCallback(
    () => processTaskOffset(+1),
    [processTaskOffset]
  );

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
      const openBot = (force = true) => {
        core.setActiveTab(current.drop?.id);
        core.closeOtherBots();
        core.openTelegramLink(current.drop.telegramLink, undefined, force);
      };

      /** First Time */
      openBot(false);

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
      /** Set Active Tab */
      if (current.drop) {
        core.setActiveTab(current.drop.id);
      }
    }
  }, [process.started, auth, current.drop, core.setActiveTab]);

  /** Reset the drops */
  useLayoutEffect(() => {
    /** Update current drop */
    setCurrent((prev) => {
      if (drops.includes(prev.drop)) {
        return prev;
      } else {
        return {
          drop: drops[INITIAL_POSITION],
          task: drops[INITIAL_POSITION]?.tasks?.[0],
        };
      }
    });
  }, [drops, setCurrent]);

  /** Stop When There's no Drop */
  useEffect(() => {
    if (process.started && !current.drop) {
      process.stop();
      toast.error("No Farmer enabled in the Zoomies");
    }
  }, [process.started, process.stop, current.drop]);

  /** Restore State */
  useEffect(() => {
    if (hasRestoredZoomiesState) {
      const prevState = zoomiesState;
      const drop = drops.find((item) => item.id === prevState.dropId);
      const task = prevState.task;

      if (drop) {
        setCurrent({
          drop,
          task,
        });
      }
    }
  }, [hasRestoredZoomiesState, setCurrent]);

  /** Store in Settings */
  useEffect(() => {
    if (hasRestoredZoomiesState) {
      storeZoomiesState({
        dropId: current?.drop?.id,
        task: current?.task,
      });
    }
  }, [hasRestoredZoomiesState, storeZoomiesState, current]);

  return useValuesMemo({
    drops,
    enabled: process.started,
    toggle: process.toggle,
    dispatchAndToggle: process.dispatchAndToggle,
    current,
    setAuth,
    setCurrent,
    skipToNextDrop,
    processPreviousTask,
    processNextTask,
    refresh,
  });
}
