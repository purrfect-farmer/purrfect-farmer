import AppContext from "@/contexts/AppContext";
import ToolbarPanel from "@/toolbar/ToolbarPanel";
import usePortMirror from "@/hooks/usePortMirror";
import useStorageState from "@/hooks/useStorageState";

const defaultSharedSettings = {
  showMiniAppToolbar: true,
};

export default function MiniAppToolbar({ host, url, port }) {
  const mirror = usePortMirror(port);
  const { value: settings, hasRestoredValue: hasRestoredSharedSettings } =
    useStorageState("settings", defaultSharedSettings, true);
  const { showMiniAppToolbar } = settings;

  return (
    <AppContext.Provider value={{ port, host, url, mirror, settings }}>
      {hasRestoredSharedSettings && showMiniAppToolbar ? (
        <ToolbarPanel />
      ) : null}
    </AppContext.Provider>
  );
}
