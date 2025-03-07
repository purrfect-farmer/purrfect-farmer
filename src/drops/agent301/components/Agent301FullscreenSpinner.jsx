import { createPortal } from "react-dom";

import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";
import { memo } from "react";

export default memo(function Agent301FullscreenSpinner() {
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="p-4 bg-white rounded-full">
        <img
          src={Agent301Icon}
          className="w-10 h-10 rounded-full animate-spin"
        />
      </div>
    </div>,
    document.body
  );
});
