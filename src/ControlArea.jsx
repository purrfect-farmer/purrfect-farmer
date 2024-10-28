import useSocketState from "./hooks/useSocketState";
import SyncControl from "./partials/SyncControl";
import UtilsPanel from "./partials/UtilsPanel";
import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";

export default function ControlArea() {
  const [showUtils, setShowUtils, dispatchAndSetShowUtils] = useSocketState(
    "app.toggle-utils",
    false
  );

  return (
    <>
      {/* Utils */}
      <UtilsPanel open={showUtils} onOpenChange={dispatchAndSetShowUtils} />
      <div className="flex pl-10 bg-white border-t shrink-0">
        <SyncControl />

        {/* Utils */}
        <button
          className="flex items-center justify-center w-10 h-10"
          onClick={() => dispatchAndSetShowUtils(true)}
        >
          <img src={CoreSystemIcon} className="w-7 h-7" />
        </button>
      </div>
    </>
  );
}
