import FarmerContext from "@/contexts/FarmerContext";
import { cn } from "@/lib/utils";
import { memo } from "react";

import FarmerInit from "./FarmerInit";

export default memo(function Farmer({
  farmer,
  children,
  className,
  initClassName,
}) {
  return (
    <FarmerContext.Provider value={farmer}>
      <div className={cn("flex flex-col min-w-0 min-h-0 grow", className)}>
        {farmer.started ? (
          children
        ) : (
          <FarmerInit
            mode={farmer.mode}
            title={farmer.title}
            icon={farmer.icon}
            status={farmer.status}
            className={initClassName}
          />
        )}
      </div>
    </FarmerContext.Provider>
  );
});
