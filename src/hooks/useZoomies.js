import defaultZoomiesState from "@/core/defaultZoomiesState";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useMirroredCallback from "./useMirroredCallback";
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

  /** Process */
  const process = useProcessLock("zoomies", core.mirror);

  /** Started */
  const [started, setStarted] = useState(false);

  /** Quick Run */
  const [quickRun, setQuickRun] = useState(false);

  /** All Drops */
  const zoomiesDrops = useMemo(
    () =>
      core.drops
        .map((item) => ({
          ...item,
          tasks: Object.keys(item.tasks),
        }))
        .filter((item) => item.tasks.length > 0),
    [core.drops]
  );

  /** Quick Run Drops */
  const quickRunDrops = useMemo(
    () =>
      core.drops
        .map((item) => ({
          ...item,
          tasks: Object.entries(item.tasks)
            .filter(([, v]) => Boolean(v))
            .map(([k]) => k),
        }))
        .filter((item) => item.tasks.length > 0),
    [core.drops]
  );

  /** Drops */
  const drops = quickRun ? quickRunDrops : zoomiesDrops;

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
    /** Reset Started */
    setStarted(false);

    /** Close Farmer Tabs */
    core.closeFarmerTabs();

    /** Set Active Tab */
    if (current.drop?.id) {
      core.setActiveTab(current.drop?.id);
    }
  }, [setStarted, current.drop?.id, core.closeFarmerTabs, core.setActiveTab]);

  /** Toggle Zoomies */
  const [toggle, dispatchAndToggle] = useMirroredCallback(
    "zoomies.enable-zoomies",
    (state = true, quick = false) => {
      setQuickRun(quick);
      process.toggle(state);
    },
    [setQuickRun, process.toggle],

    /** Mirror */
    core.mirror
  );

  /** Refresh Zoomies */
  const [refresh, dispatchAndRefresh] = useMirroredCallback(
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

    /** Mirror */
    core.mirror
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
    if (canProcessZoomies && started === false) {
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
  }, [canProcessZoomies, started, openBot, skipToNextDrop]);

  /** Handle Started */
  useLayoutEffect(() => {
    if (!canProcessZoomies) return;

    if (started) {
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
    started,
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
            item.tasks.join(":") === prev?.drop?.tasks?.join(":") &&
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
      const task = prevState.task;
      const drop = drops.find(
        (item) =>
          item.id === prevState.dropId && item.tasks.includes(prevState.task)
      );

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
    setStarted,
    setCurrent,
    toggle,
    skipToNextDrop,
    processPreviousTask,
    processNextTask,
    refresh,
    dispatchAndRefresh,
  });
}
