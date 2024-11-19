import defaultZoomiesState from "@/defaultZoomiesState";
import farmerTabs from "@/farmerTabs";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { useEffect } from "react";
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
  const process = useProcessLock("zoomies", core.socket);

  /** Auth */
  const [auth, setAuth] = useState(false);

  /** Current State */
  const [current, setCurrent] = useState({
    drop: drops[INITIAL_POSITION],
    task: drops[INITIAL_POSITION]?.tasks?.[0],
    cycles: 0,
  });

  /** Repeat Zoomies Cycle */
  const repeatZoomiesCycle =
    core.settings.repeatZoomiesCycle || current.cycles === 0;

  /** Can Process Zoomies */
  const canProcessZoomies =
    process.started && current.drop && repeatZoomiesCycle;

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
        cycles: 0,
      };
    });
  }, [drops, setCurrent]);

  /** Skip to Next Drop */
  const skipToNextDrop = useCallback(() => {
    setCurrent((prev) => {
      const drop = drops[(drops.indexOf(prev.drop) + 1) % drops.length];
      const cycles = prev.cycles + (drop === drops.at(0) ? 1 : 0);

      return {
        cycles,
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
            const cycles =
              prev.cycles + (direction === 1 && drop === drops.at(0) ? 1 : 0);

            return {
              drop,
              task,
              cycles,
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

  /** Stop Zoomies after first cycle */
  useEffect(() => {
    if (process.started && !repeatZoomiesCycle) {
      process.stop();
      core.cancelTelegramHandlers();
      core.resetTabs();
      setCurrent((prev) => ({
        ...prev,
        cycles: 0,
      }));
    }
  }, [
    process.started,
    repeatZoomiesCycle,
    core.cancelTelegramHandlers,
    core.resetTabs,
    setCurrent,
  ]);

  /** Reset Zoomies */
  useEffect(() => {
    if (canProcessZoomies) {
      resetZoomies();
    }
  }, [canProcessZoomies, resetZoomies]);

  /** Open Bot */
  useEffect(() => {
    if (canProcessZoomies && !auth) {
      /** Open Bot */
      const openBot = (force = true) => {
        core.setActiveTab(current.drop?.id);
        core.closeOtherBots();
        core.openTelegramBot(current.drop.telegramLink, undefined, force);
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
  }, [canProcessZoomies, auth, current.drop]);

  /** Handle Auth */
  useEffect(() => {
    if (!canProcessZoomies) return;

    if (auth) {
      /** Set Active Tab */
      if (current.drop) {
        core.setActiveTab(current.drop.id);
      }
    }
  }, [canProcessZoomies, auth, current.drop, core.setActiveTab]);

  /** Reset the drops */
  useEffect(() => {
    /** Update current drop */
    setCurrent((prev) => {
      if (drops.includes(prev.drop)) {
        return prev;
      } else {
        return {
          ...prev,
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
        setCurrent((prev) => ({
          ...prev,
          drop,
          task,
        }));
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
