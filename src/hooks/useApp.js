import { useCallback } from "react";
import { useEffect } from "react";

import useCore from "./useCore";
import useMirroredState from "./useMirroredState";
import useMirroredTabs from "./useMirroredTabs";
import useTelegramUser from "./useTelegramUser";
import useValuesMemo from "./useValuesMemo";
import useZoomies from "./useZoomies";

export default function useApp() {
  const core = useCore();
  const zoomies = useZoomies(core);
  const telegramUser = useTelegramUser(core);

  const { updateActiveAccount } = core;

  /** Utils Panel State */
  const [showUtilsPanel, setShowUtilsPanel, dispatchAndSetShowUtilsPanel] =
    useMirroredState("app.toggle-utils-panel", false, core.mirror);

  /** Utils Panel Tabs */
  const utilsPanelTabs = useMirroredTabs(
    "app.utils-panel-tabs",
    ["utils", "system"],
    "utils",
    core.mirror
  );

  const { dispatchAndSetValue: dispatchAndSetUtilsPanelTabValue } =
    utilsPanelTabs;

  /** Open Utils Panel */
  const dispatchAndOpenUtilsPanel = useCallback(
    (tab = "utils") => {
      dispatchAndSetUtilsPanelTabValue(tab);
      dispatchAndSetShowUtilsPanel(true);
    },
    [
      /** Deps */
      dispatchAndSetUtilsPanelTabValue,
      dispatchAndSetShowUtilsPanel,
    ]
  );

  /** Whisker Message */
  useEffect(() => {
    if (import.meta.env.VITE_WHISKER) {
      const listener = (ev) => {
        if (
          typeof ev.data === "object" &&
          ev.data.action === "set-whisker-account"
        ) {
          const { data } = ev.data;
          updateActiveAccount({
            title: data.title,
          });
        }
      };

      /** Add Listener */
      window.addEventListener("message", listener);

      return () => window.removeEventListener("message", listener);
    }
  }, [updateActiveAccount]);

  return useValuesMemo({
    ...core,
    zoomies,
    telegramUser,
    utilsPanelTabs,
    showUtilsPanel,
    setShowUtilsPanel,
    dispatchAndSetShowUtilsPanel,
    dispatchAndOpenUtilsPanel,
  });
}
