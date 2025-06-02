import { memo } from "react";

import useMetaLottUserQuery from "../hooks/useMetaLottUserQuery";

export default memo(function MetaLottBalanceDisplay() {
  const query = useMetaLottUserQuery();

  const usdtBalance = query.data?.["usdtBalance"] || 0;
  const level = query.data?.["level"] || 0;

  return (
    <div className="flex flex-col gap-2 text-center text-orange-600">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="text-2xl font-bold">
            {Intl.NumberFormat().format(usdtBalance)}
          </h3>
          <h4>LVL {level}</h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
