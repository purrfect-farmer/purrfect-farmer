import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import { useState } from "react";

import SyncControl from "./partials/SyncControl";
import UtilsPanel from "./partials/UtilsPanel";

export default function ControlArea() {
  const [showUtils, setShowUtils] = useState(false);

  return (
    <>
      {/* Utils */}
      <UtilsPanel open={showUtils} onOpenChange={setShowUtils} />
      <div className="flex pl-10 bg-white border-t shrink-0">
        <SyncControl />

        {/* Utils */}
        <button
          className="flex items-center justify-center w-10 h-10"
          onClick={() => setShowUtils(true)}
        >
          <img src={CoreSystemIcon} className="w-7 h-7" />
        </button>
      </div>
    </>
  );
}
