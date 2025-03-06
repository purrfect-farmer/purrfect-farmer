import AppContext from "@/contexts/AppContext";
import ToolbarPanel from "@/toolbar/ToolbarPanel";
import usePortMirror from "@/hooks/usePortMirror";

export default function MiniAppToolbar({ url, port }) {
  const mirror = usePortMirror(port);

  return (
    <AppContext.Provider value={{ mirror, url }}>
      <ToolbarPanel />
    </AppContext.Provider>
  );
}
