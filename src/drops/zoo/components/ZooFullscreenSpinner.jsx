import { createPortal } from "react-dom";
import { memo } from "react";

import ZooIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function ZooFullscreenSpinner() {
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="p-4 bg-white rounded-full">
        <img src={ZooIcon} className="w-10 h-10 rounded-full animate-spin" />
      </div>
    </div>,
    document.body
  );
});
