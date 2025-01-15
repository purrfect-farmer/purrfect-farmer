import { memo } from "react";

import BTCIcon from "../assets/images/btc.webp";
import USDIcon from "../assets/images/usd.webp";
import useCEXUserQuery from "../hooks/useCEXUserQuery";
import { useMemo } from "react";

export default memo(function CEXInfoDisplay() {
  const userQuery = useCEXUserQuery();
  const precisionBtc = useMemo(
    () => Number(userQuery.data?.["precision_BTC"] || 1),
    [userQuery.data]
  );
  const btc = useMemo(
    () =>
      Number(userQuery.data?.["balance_BTC"] || 0) / Math.pow(10, precisionBtc),
    [userQuery.data]
  );
  const balance = useMemo(
    () => Number(userQuery.data?.["balance_USD"] || 0),
    [userQuery.data]
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-center text-white-500">
          <img src={USDIcon} className="inline w-4 h-4" />{" "}
          {Intl.NumberFormat().format(balance)}
        </h3>
        <h3 className="font-bold text-center text-sky-500">
          <img src={BTCIcon} className="inline w-5 h-5" />{" "}
          {Intl.NumberFormat().format(btc)}
        </h3>
      </div>
    </>
  );
});
