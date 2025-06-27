import { memo } from "react";

import useGoldEagleUserProgressQuery from "../hooks/useGoldEagleUserProgressQuery";

export default memo(function GoldEagleBalanceDisplay() {
  const query = useGoldEagleUserProgressQuery();

  const coins = query.data?.["coins_amount"] || 0;
  const energy = query.data?.["energy"] || 0;
  const maxEnergy = query.data?.["max_energy"] || 0;

  return (
    <div className="flex flex-col gap-2 text-center text-orange-600">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="text-2xl font-bold">
            {Intl.NumberFormat().format(coins)}
          </h3>
          <h4 className="flex items-center justify-center gap-2">
            ENERGY: {energy} / {maxEnergy}
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
