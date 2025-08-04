import { memo } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import useBattleBullsUserQuery from "../hooks/useBattleBullsUserQuery";

export default memo(function BattleBullsInfoDisplay() {
  const userQuery = useBattleBullsUserQuery();
  const user = userQuery?.data;
  const balance = user?.balance;

  /** TPH */
  const profitPerHour = user?.passiveIncome?.incomePerHour;

  return (
    <div className="flex flex-col text-center ">
      {userQuery.isPending ? (
        "Fetching balance..."
      ) : userQuery.isSuccess ? (
        <>
          <h3 className="text-2xl font-bold text-center text-orange-500">
            <img src={CoinIcon} className="inline w-5 h-5" />{" "}
            {Intl.NumberFormat().format(balance || 0)}
          </h3>
          <h4 className="font-bold text-center text-orange-500">
            +{Intl.NumberFormat().format(profitPerHour || 0)} PPH
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
