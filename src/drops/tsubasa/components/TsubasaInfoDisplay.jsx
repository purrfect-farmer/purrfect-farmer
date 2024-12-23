import useFarmerContext from "@/hooks/useFarmerContext";
import { memo } from "react";
import { useMemo } from "react";

import BallIcon from "../assets/images/ball.png?format=webp&w=80";

export default memo(function TsubasaInfoDisplay() {
  const { authQuery } = useFarmerContext();
  const user = authQuery.data?.["game_data"]?.["user"];

  const autoBallProfitPerHour = user?.["auto_tapper_profit_per_hour"] || 0;

  /** All Cards */
  const allCards = useMemo(
    () =>
      authQuery.data["card_info"].reduce(
        (result, category) => result.concat(category["card_list"]),
        []
      ),
    [authQuery.data["card_info"]]
  );

  /** Unlocked Cards */
  const unlockedCards = useMemo(
    () => allCards.filter((card) => card["unlocked"]),
    [allCards]
  );

  /** TPH */
  const profitPerHour = useMemo(
    () =>
      unlockedCards.reduce(
        (result, item) => result + Math.floor(item["profit_per_hour"]),
        0
      ) + autoBallProfitPerHour,
    [autoBallProfitPerHour, unlockedCards]
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-center text-indigo-500">
          <img src={BallIcon} className="inline w-5 h-5" />{" "}
          {Intl.NumberFormat().format(user?.["total_coins"] || 0)}
        </h3>
        <h4 className="font-bold text-center text-indigo-500">
          +{Intl.NumberFormat().format(profitPerHour || 0)} PPH
        </h4>
      </div>
    </>
  );
});
