import { memo } from "react";

import useBlumBalanceQuery from "../hooks/useBlumBalanceQuery";

export default memo(function BlumBalanceDisplay() {
  const query = useBlumBalanceQuery();

  return (
    <div className="py-4 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="text-xl font-bold">
            {Intl.NumberFormat().format(query.data.availableBalance)}
          </h3>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
