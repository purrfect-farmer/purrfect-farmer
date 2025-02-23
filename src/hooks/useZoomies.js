import defaultZoomiesState from "@/core/defaultZoomiesState";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useProcessLock from "./useProcessLock";
import useSocketDispatchCallback from "./useSocketDispatchCallback";
import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

const INITIAL_POSITION = 0;

export default function useZoomies(core) {
  const {
    value: zoomiesState,
    hasRestoredValue: hasRestoredZoomiesState,
    storeValue: storeZoomiesState,
  } = useStorageState("zoomiesState", defaultZoomiesState);

  /** Process */
  const process = useProcessLock("zoomies", core.socket);

  /** Auth */
  const [auth, setAuth] = useState(false);

  /** Quick Run */
  const [quickRun, setQuickRun] = useState(false);

  /** Drops */
  const drops = useMemo(
    () =>
      core.drops
        .map((item) => ({
          ...item,
          tasks: quickRun
            ? Object.entries(item.tasks)
                .filter(([k, v]) => Boolean(v))
                .map(([k, v]) => k)
            : Object.keys(item.tasks),
        }))
        .filter((item) => item.tasks.length > 0),
    [quickRun, core.drops]
  );

  /** Current State */
  const [current, setCurrent] = useState({
    drop: drops[INITIAL_POSITION],
    task: drops[INITIAL_POSITION]?.tasks?.[0],
    cycles: 0,
  });

  /** Repeat Zoomies Cycle */
  const repeatZoomiesCycle = quickRun
    ? current.cycles <= 2
    : core.settings.repeatZoomiesCycle || current.cycles === 0;

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
    if (current.drop?.id) {
      core.setActiveTab(current.drop?.id);
    }
  }, [setAuth, current.drop?.id, core.closeFarmerTabs, core.setActiveTab]);

  /** Toggle Zoomies */
  const [toggle, dispatchAndToggle] = useSocketDispatchCallback(
    "zoomies.enable-zoomies",
    (state = true, quick = false) => {
      setQuickRun(quick);
      process.toggle(state);
    },
    [setQuickRun, process.toggle],

    /** Socket */
    core.socket
  );

  /** Refresh Zoomies */
  const [refresh, dispatchAndRefresh] = useSocketDispatchCallback(
    "zoomies.refresh",
    () => {
      setCurrent(() => {
        return {
          drop: drops[INITIAL_POSITION],
          task: drops[INITIAL_POSITION]?.tasks?.[0],
          cycles: 0,
        };
      });
    },
    [drops, setCurrent],

    /** Socket */
    core.socket
  );

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

  /** Open Bot */
  const openBot = useCallback(
    (force = true) => {
      core.setActiveTab(current.drop?.id);
      core.closeOtherBots();
      core.openTelegramBot(current.drop.telegramLink, undefined, force);
    },
    [
      current.drop?.id,
      current.drop?.telegramLink,
      core.closeOtherBots,
      core.openTelegramBot,
    ]
  );

  /** Stop Zoomies after first cycle */
  useLayoutEffect(() => {
    if (process.started && repeatZoomiesCycle === false) {
      process.stop();
      core.cancelTelegramHandlers();
      core.resetTabs();
      setQuickRun(false);
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
    setQuickRun,
  ]);

  /** Reset Zoomies */
  useLayoutEffect(() => {
    if (current.cycles >= 0 && canProcessZoomies) {
      resetZoomies();
    }
  }, [current.cycles, canProcessZoomies, resetZoomies]);

  /** Open Bot */
  useLayoutEffect(() => {
    if (canProcessZoomies && auth === false) {
      /** Timeout */
      let timeout;

      /** Attempts */
      let attempts = 0;

      /** Update Timeout */
      const updateTimeout = () => {
        timeout = setTimeout(reOpenBot, 60_000);
      };

      /** ReOpen Bot */
      const reOpenBot = () => {
        if (++attempts > 2) {
          skipToNextDrop();
        } else {
          updateTimeout();
        }
      };

      /** First Time */
      openBot(false);

      /** Update Timeout */
      updateTimeout();

      /** Clear Timeout */
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [canProcessZoomies, auth, openBot, skipToNextDrop]);

  /** Handle Auth */
  useLayoutEffect(() => {
    if (!canProcessZoomies) return;

    if (auth) {
      if (current.drop) {
        /** Close Other Bots */
        if (current.drop.closeBotInZoomies !== false) {
          core.closeOtherBots();
        }

        /** Focus */
        core.setActiveTab(current.drop.id);
      }
    }
  }, [
    auth,
    canProcessZoomies,
    current.drop?.id,
    current.drop?.closeBotInZoomies,
    core.closeOtherBots,
    core.setActiveTab,
  ]);

  /** Reset the drops */
  useLayoutEffect(() => {
    /** Update current drop */
    setCurrent((prev) => {
      if (
        drops.some(
          (item) =>
            item.id === prev?.drop?.id &&
            item.tasks.length === prev?.drop?.tasks?.length &&
            item.tasks.includes(prev?.task)
        )
      ) {
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
  useLayoutEffect(() => {
    if (process.started && !current.drop) {
      process.stop();
      toast.error("No Farmer enabled in the Zoomies");
    }
  }, [process.started, process.stop, current.drop]);

  /** Restore State */
  useLayoutEffect(() => {
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
  useLayoutEffect(() => {
    if (hasRestoredZoomiesState) {
      storeZoomiesState({
        dropId: current?.drop?.id,
        task: current?.task,
      });
    }
  }, [
    hasRestoredZoomiesState,
    storeZoomiesState,
    current?.drop?.id,
    current?.task,
  ]);

  return useValuesMemo({
    drops,
    quickRun,
    enabled: process.started,
    toggle,
    dispatchAndToggle,
    current,
    setAuth,
    setCurrent,
    toggle,
    skipToNextDrop,
    processPreviousTask,
    processNextTask,
    refresh,
    dispatchAndRefresh,
  });
}
