import FarmerContext from "@/contexts/FarmerContext";
import FullSpinner from "@/components/FullSpinner";
import { useMemo } from "react";
import { useRef } from "react";

import NotPixelAuthDetect from "./components/NotPixelAuthDetect";
import NotPixelFarmer from "./components/NotPixelFarmer";
import useNotPixelFarmer from "./hooks/useNotPixelFarmer";

function NotPixel() {
  const farmer = useNotPixelFarmer();
  const sandboxRef = useRef();
  const sandboxSrc = useMemo(
    () => chrome.runtime.getURL("notpixel-sandbox.html"),
    []
  );

  return (
    <>
      <FarmerContext.Provider value={farmer}>
        {farmer.user ? (
          <NotPixelFarmer sandboxRef={sandboxRef} />
        ) : farmer.auth ? (
          <FullSpinner />
        ) : (
          <NotPixelAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
      <iframe src={sandboxSrc} ref={sandboxRef} hidden />
    </>
  );
}

export default NotPixel;
