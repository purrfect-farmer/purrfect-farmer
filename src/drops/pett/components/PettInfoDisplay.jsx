import { cn } from "@/lib/utils";
import { memo } from "react";

import usePettStatusQuery from "../hooks/usePettStatusQuery";

export default memo(function PettInfoDisplay() {
  const query = usePettStatusQuery();

  return (
    <div className="flex flex-col gap-2 text-center">
      {query.isPending ? (
        "Retrieving stats..."
      ) : query.isSuccess ? (
        <>
          <div className="flex flex-col">
            {/* Balance AIP */}
            <h3 className="text-purple-500 text-lg font-bold">
              {query.data.balanceAIP} $AIP
            </h3>

            {/* Balance ETH */}
            <h3 className="text-blue-500 text-lg font-bold">
              {query.data.balanceETH} $ETH
            </h3>
          </div>

          <h4>State: {query.data.state.toUpperCase()}</h4>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-2 px-2">
            {Object.entries(query.data.stats).map(([key, item]) => (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-1 p-2 rounded-full",
                  "bg-neutral-100 dark:bg-neutral-700"
                )}
              >
                {item.title} - <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
