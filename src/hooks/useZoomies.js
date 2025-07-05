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
  const { value: zoomiesState, storeValue: storeZoomiesState } =
    useStorageState("zoomies-state", defaultZoomiesState);

  /** Farmer Mode */
  const farmerMode = core.farmerMode;

  /** Process */
  const process = useProcessLock("zoomies", core.mirror);

  /** Farmer has Started */
  const [farmerHasStarted, setFarmerHasStarted] = useState(false);

  /** Quick Run */
  const [quickRun, setQuickRun] = useState(false);

  /** All Drops */
  const zoomiesDrops = useMemo(
    () => core.drops.filter((item) => item.tasks.all.length > 0),
    [farmerMode, core.drops]
  );

  /** Quick Run Drops */
  const quickRunDrops = useMemo(
    () => core.drops.filter((item) => item.tasks.quick.length > 0),
    [core.drops]
  );

  /** Drops */
  const drops = quickRun ? quickRunDrops : zoomiesDrops;

  /** Tasks List */
  const taskList = quickRun ? "quick" : "all";

  /** Current State */
  const [current, setCurrent] = useState(() => {
    return {
      drop: drops.find(
        (item) =>
          item.id === zoomiesState.dropId &&
          item.tasks[taskList].includes(zoomiesState.task)
      ),
      task: zoomiesState.task,
      cycles: 0,
    };
  });

  /** Tasks Count */
  const tasksCount = useMemo(
    () => current.drop?.tasks?.[taskList]?.length,
    [taskList, current.drop?.tasks]
  );

  /** Current Task Offset */
  const currentTaskOffset = useMemo(
    () => current.drop?.tasks?.[taskList]?.indexOf?.(current.task) + 1,
    [taskList, current.drop?.tasks, current.task]
  );

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
    setFarmerHasStarted(false);

    /** Close Farmer Tabs */
    core.closeFarmerTabs();

    /** Set Active Tab */
    if (current.drop?.id) {
      core.setActiveTab(current.drop?.id);
    }
  }, [
    setFarmerHasStarted,
    current.drop?.id,
    core.closeFarmerTabs,
    core.setActiveTab,
  ]);

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
          task: drops[INITIAL_POSITION]?.tasks?.[taskList]?.[0],
          cycles: 0,
        };
      });
    },
    [taskList, drops, setCurrent],

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
        task: drop?.tasks?.[taskList]?.[0],
      };
    });
  }, [taskList, drops, setCurrent]);

  /** Process task Offset */
  const processTaskOffset = useCallback(
    (direction) => {
      if (process.started) {
        setCurrent((prev) => {
          if (
            prev.task ===
            prev.drop?.tasks?.[taskList]?.at(direction === 1 ? -1 : 0)
          ) {
            const index = (drops.indexOf(prev.drop) + direction) % drops.length;
            const drop = drops.at(index);
            const task = drop?.tasks?.[taskList]?.at(direction === 1 ? 0 : -1);
            const cycles =
              prev.cycles + (direction === 1 && drop === drops.at(0) ? 1 : 0);

            return {
              drop,
              task,
              cycles,
            };
          } else {
            const tasks = prev.drop.tasks[taskList];
            const index = (tasks.indexOf(prev.task) + direction) % tasks.length;

            return {
              ...prev,
              task: tasks.at(index),
            };
          }
        });
      }
    },
    [taskList, process.started, drops, setCurrent]
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
      if (farmerMode === "web" || current.drop?.usesPort) {
        core.setActiveTab(current.drop?.id);
        core.closeOtherBots();
        core.openTelegramBot(current.drop.telegramLink, {
          force,
          browserId: current.drop.id,
          browserTitle: current.drop.title,
          browserIcon: current.drop.icon,
          embedWebPage: current.drop.embedWebPage,
          embedInNewWindow: current.drop.embedInNewWindow,
        });
      }
    },
    [
      farmerMode,
      current.drop?.id,
      current.drop?.telegramLink,
      current.drop?.usesPort,
      core.closeOtherBots,
      core.openTelegramBot,
    ]
  );

  /** Stop Zoomies after first cycle */
  useLayoutEffect(() => {
    if (process.started && repeatZoomiesCycle === false) {
      process.stop();
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
    if (canProcessZoomies && farmerHasStarted === false) {
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
  }, [canProcessZoomies, farmerHasStarted, openBot, skipToNextDrop]);

  /** Handle Started */
  useLayoutEffect(() => {
    if (!canProcessZoomies) return;

    if (farmerHasStarted) {
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
    farmerHasStarted,
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
            item.tasks[taskList].includes(prev?.task)
        )
      ) {
        return prev;
      } else {
        return {
          ...prev,
          drop: drops[INITIAL_POSITION],
          task: drops[INITIAL_POSITION]?.tasks?.[taskList]?.[0],
        };
      }
    });
  }, [taskList, drops, setCurrent]);

  /** Stop When There's no Drop */
  useLayoutEffect(() => {
    if (process.started && !current.drop) {
      process.stop();
      toast.error("No Farmer enabled in the Zoomies");
    }
  }, [process.started, process.stop, current.drop]);

  /** Store in Settings */
  useLayoutEffect(() => {
    storeZoomiesState({
      dropId: current?.drop?.id,
      task: current?.task,
    });
  }, [storeZoomiesState, current?.drop?.id, current?.task]);

  return useValuesMemo({
    drops,
    quickRun,
    enabled: process.started,
    current,
    toggle,
    refresh,
    tasksCount,
    currentTaskOffset,
    setCurrent,
    skipToNextDrop,
    setFarmerHasStarted,
    processPreviousTask,
    processNextTask,
    dispatchAndToggle,
    dispatchAndRefresh,
  });
}
