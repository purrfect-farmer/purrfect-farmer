import AppContext from "@/contexts/AppContext";
import ToolbarPanel from "@/toolbar/ToolbarPanel";
import usePortMirror from "@/hooks/usePortMirror";
import useStorageState from "@/hooks/useStorageState";

const defaultSharedSettings = {
  showMiniAppToolbar: import.meta.env.DEV,
};

export default function MiniAppToolbar({ host, url, port }) {
  const mirror = usePortMirror(port);
  const { value: settings } = useStorageState(
    "settings",
    defaultSharedSettings,
    true
  );
  const { showMiniAppToolbar } = settings;

  return (
    <AppContext.Provider value={{ port, host, url, mirror, settings }}>
      {showMiniAppToolbar ? <ToolbarPanel /> : null}
    </AppContext.Provider>
  );
}
