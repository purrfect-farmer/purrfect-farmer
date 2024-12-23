import FarmerContext from "@/contexts/FarmerContext";
import { memo } from "react";

import NotgramAuthDetect from "./components/NotgramAuthDetect";
import NotgramFarmer from "./components/NotgramFarmer";
import useNotgramFarmer from "./hooks/useNotgramFarmer";

export default memo(function Notgram() {
  const farmer = useNotgramFarmer();
  return (
    <div className="flex flex-col min-w-0 min-h-0 text-[#f5bb5f] bg-neutral-800 grow">
      <FarmerContext.Provider value={farmer}>
        {farmer.auth ? (
          <NotgramFarmer />
        ) : (
          <NotgramAuthDetect status={farmer.status} />
        )}
      </FarmerContext.Provider>
    </div>
  );
});
