import FarmerContext from "@/contexts/FarmerContext";
import { useMemo } from "react";
import { useRef } from "react";

import NotPixelAuthDetect from "./components/NotPixelAuthDetect";
import NotPixelFarmer from "./components/NotPixelFarmer";
import useNotPixelFarmer from "./hooks/useNotPixelFarmer";

function NotPixel() {
  const farmer = useNotPixelFarmer();
  const sandboxRef = useRef();
  const sandboxSrc = useMemo(
    () => chrome?.runtime?.getURL("notpixel-sandbox.html"),
    []
  );

  return (
    <>
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <>
            <NotPixelFarmer sandboxRef={sandboxRef} />
            <iframe src={sandboxSrc} ref={sandboxRef} hidden />
          </>
        ) : (
          <NotPixelAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </>
  );
}

export default NotPixel;
