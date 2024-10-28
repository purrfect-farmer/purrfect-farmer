import farmerTabs from "@/farmerTabs";
import toast from "react-hot-toast";
import { postPortMessage } from "@/lib/utils";
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
    (tab, override = false) => {
      if (openedTabs.find((item) => item.id === tab.id)) {
        /** Push Update */
        setOpenedTabs((previous) =>
          previous.map((item) =>
            item.id === tab.id
              ? { ...(override ? tab : item), active: true }
              : { ...item, active: false }
          )
        );
      } else {
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

  const openTelegramLink = useCallback(
    async (url) => {
      if (!url) {
        return;
      }
      const telegramWeb = openedTabs.find((tab) =>
        ["telegram-web-k", "telegram-web-a"].includes(tab.id)
      );

      if (!telegramWeb) {
        toast.dismiss();
        return toast.error("Please open Telegram Web");
      }

      const miniApps = messaging.ports
        .values()
        .filter((port) => port.name.startsWith("mini-app:"))
        .toArray();

      if (!miniApps.length) {
        toast.dismiss();
        return toast.error("No Telegram Bot Running..");
      }

      /** Post Message to First Port */
      postPortMessage(miniApps[0], {
        action: "open-telegram-link",
        data: { url },
      }).then(() => {
        setActiveTab(telegramWeb.id);
      });

      /** Close Other Bots */
      if (settings.closeOtherBots) {
        miniApps.slice(1).forEach((port) => {
          if (port.name !== `mini-app:${import.meta.env.VITE_APP_BOT_HOST}`) {
            postPortMessage(port, {
              action: "close-bot",
            });
          }
        });
      }
    },
    [openedTabs, messaging.ports, setActiveTab, settings.closeOtherBots]
  );

  return useMemo(
    () => ({
      settings,
      socket,
      messaging,
      openedTabs,
      setActiveTab,
      closeTab,
      pushTab,
      reloadTab,
      configureSettings,
      openTelegramLink,
    }),
    [
      settings,
      socket,
      messaging,
      openedTabs,
      setActiveTab,
      closeTab,
      pushTab,
      reloadTab,
      configureSettings,
      openTelegramLink,
    ]
  );
}
