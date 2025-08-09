import defaultZoomiesState from "@/core/defaultZoomiesState";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { useLayoutEffect } from "react";
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

  /** Drops */
  const drops = core.drops;

  /** Current State */
  const [current, setCurrent] = useState(() => {
    return {
      drop: drops.find((item) => item.id === zoomiesState.dropId),
      cycles: 0,
    };
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
    setFarmerHasStarted(false);

    /** Close Farmer Tabs */
    core.closeFarmerTabs();

    /** Set Active Tab */
    if (current.drop?.id) {
      core.setActiveTab(current.drop?.id);
    }
  }, [
    current.drop?.id,
    core.closeFarmerTabs,
    core.setActiveTab,
    setFarmerHasStarted,
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
          cycles: 0,
        };
      });
    },
    [drops, setCurrent],

    /** Mirror */
    core.mirror
  );

  /** Process task Offset */
  const processTaskOffset = useCallback(
    (direction) => {
      if (process.started) {
        setCurrent((prev) => {
          const index = (drops.indexOf(prev.drop) + direction) % drops.length;

          if (prev.drop === drops.at(direction === 1 ? -1 : 0)) {
            const drop = drops.at(index);
            const cycles =
              prev.cycles + (direction === 1 && drop === drops.at(0) ? 1 : 0);

            return {
              drop,
              cycles,
            };
          } else {
            return {
              ...prev,
              drop: drops.at(index),
            };
          }
        });
      }
    },
    [process.started, drops, setCurrent]
  );

  /** Process the previous task */
  const processPreviousTask = useCallback(
    () => processTaskOffset(-1),
    [processTaskOffset]
  );

  /** Process the next task */
  const processNextTask = useCallback(
    () => processTaskOffset(+1),
    [processTaskOffset]
  );

  /** Skip to Next Drop */
  const skipToNextDrop = useCallback(
    () => processNextTask(),
    [processNextTask]
  );

  /** Open Bot */
  const openBot = useCallback(
    (force = true) => {
      if (farmerMode === "web") {
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
    repeatZoomiesCycle,
    process.started,
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
    if (canProcessZoomies && farmerHasStarted) {
      if (current.drop) {
        /** Close Other Bots */
        if (current.drop.closeBotInZoomies !== false) {
          core.closeOtherBots();
        }

        /** Focus on Farmer Tab */
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
      if (drops.some((item) => item.id === prev?.drop?.id)) {
        return prev;
      } else {
        return {
          ...prev,
          drop: drops[INITIAL_POSITION],
        };
      }
    });
  }, [drops, setCurrent]);

  /** Stop When There's no Drop */
  useLayoutEffect(() => {
    if (process.started && !current.drop) {
      process.stop();
      toast.error("No Farmer enabled in the Zoomies!");
    }
  }, [process.started, process.stop, current.drop]);

  /** Store in Settings */
  useLayoutEffect(() => {
    storeZoomiesState({
      dropId: current?.drop?.id,
    });
  }, [storeZoomiesState, current?.drop?.id]);

  return useValuesMemo({
    drops,
    quickRun,
    enabled: process.started,
    current,
    toggle,
    refresh,
    setCurrent,
    skipToNextDrop,
    setFarmerHasStarted,
    processPreviousTask,
    processNextTask,
    dispatchAndToggle,
    dispatchAndRefresh,
  });
}
