import farmerTabs from "@/farmerTabs";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useMessagePort from "./useMessagePort";
import useSettings from "./useSettings";
import useSocket from "./useSocket";

const defaultOpenedTabs = () => [{ ...farmerTabs[0], active: true }];

export default function useApp() {
  const { settings, configureSettings } = useSettings();
  const socket = useSocket(settings.syncServer);
  const messaging = useMessagePort();

  const [openedTabs, setOpenedTabs] = useState(defaultOpenedTabs);

  const setActiveTab = useCallback(
    (id) => {
      if (openedTabs.find((item) => item.id === id)) {
        setOpenedTabs((previous) =>
          previous.map((item) => ({ ...item, active: item.id === id }))
        );
        return true;
      }

      return false;
    },
    [openedTabs]
  );

  const pushTab = useCallback(
    (tab) => {
      if (!setActiveTab(tab.id)) {
        /** Push a new Tab */
        setOpenedTabs((previous) => [
          ...previous.map((item) => ({ ...item, active: false })),
          { ...tab, active: true },
        ]);
      }
    },
    [setActiveTab, setOpenedTabs]
  );

  const closeTab = useCallback(
    (id) => {
      setOpenedTabs((previous) => {
        const previousIndex = previous.findIndex((tab) => tab.id === id);

        const newTabs = previous
          .filter((item) => item.id !== id)
          .map((item, index) => ({
            ...item,
            active: index === Math.max(previousIndex - 1, 0),
          }));

        return newTabs;
      });
    },
    [setOpenedTabs]
  );

  const reloadTab = useCallback(
    (id) => {
      setOpenedTabs((previous) => {
        const newTabs = previous.map((item) =>
          item.id === id ? { ...item, reloadedAt: Date.now() } : item
        );

        return newTabs;
      });
    },
    [setOpenedTabs]
  );

  return useMemo(
    () => ({
      settings,
      configureSettings,
      socket,
      messaging,
      openedTabs,
      setActiveTab,
      closeTab,
      pushTab,
      reloadTab,
    }),
    [
      settings,
      configureSettings,
      socket,
      messaging,
      openedTabs,
      setActiveTab,
      closeTab,
      pushTab,
      reloadTab,
    ]
  );
}
