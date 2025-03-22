import { memo } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import UsdtIcon from "../assets/images/usdt.png?format=webp&w=80";
import useDiggerUserQuery from "../hooks/useDiggerUserQuery";

export default memo(function DiggerInfoDisplay() {
  const userQuery = useDiggerUserQuery();
  const user = userQuery?.data;
  const coinBalance = user?.["coin_cnt"];
  const usdtBalance = user?.["usdt_amount"];

  /** TPH */
  const profitPerHour = user?.["coin_reward"];

  return (
    <div className="flex flex-col text-center ">
      {userQuery.isPending ? (
        "Fetching balance..."
      ) : userQuery.isSuccess ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-center text-orange-500">
            <img src={CoinIcon} className="inline-flex size-5" />{" "}
            {Intl.NumberFormat().format(coinBalance || 0)}
          </h2>
          <h3 className="font-bold text-lg text-center text-green-500">
            <img src={UsdtIcon} className="inline-flex size-4" />{" "}
            {Intl.NumberFormat().format(usdtBalance || 0)}
          </h3>
          <h4 className="font-bold text-center text-orange-500">
            +{Intl.NumberFormat().format(profitPerHour || 0)} PPH
          </h4>
        </div>
      ) : (
        "Error..."
      )}
    </div>
  );
});
