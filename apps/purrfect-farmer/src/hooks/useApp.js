import { useCallback } from "react";

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

  /** Utils Panel State */
  const [showUtilsPanel, setShowUtilsPanel, dispatchAndSetShowUtilsPanel] =
    useMirroredState("app.toggle-utils-panel", false);

  /** Utils Panel Tabs */
  const utilsPanelTabs = useMirroredTabs(
    "app.utils-panel-tabs",
    ["utils", "system"],
    "utils"
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
