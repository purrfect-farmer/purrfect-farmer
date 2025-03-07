import { cn } from "@/lib/utils";
import { memo } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import EnergyIcon from "../assets/images/energy.png?format=webp&w=80";
import useDreamCoinUserQuery from "../hooks/useDreamCoinUserQuery";

export default memo(function DreamCoinInfoDisplay() {
  const query = useDreamCoinUserQuery();
  const user = query.data;

  return (
    <>
      {query.isPending ? (
        <h4 className="text-center">Fetching Info...</h4>
      ) : query.isError ? (
        <h4 className="text-center text-red-500">Error Fetching Info...</h4>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Username */}
          <h2 className="font-bold text-center text-orange-500">
            {user?.name}
          </h2>

          {/* Level */}
          <h2 className="font-bold text-center text-orange-500">
            LVL {user?.clickerLevel?.current || 0}
          </h2>

          {/* Balance */}
          <h3 className="text-2xl font-bold text-center text-orange-500">
            <img src={CoinIcon} className="inline w-5 h-5" />{" "}
            {Intl.NumberFormat().format(user?.balance || 0)}
          </h3>

          {/* Energy */}
          <h4 className="text-lg font-bold text-center text-pink-500">
            <img src={EnergyIcon} className="inline w-5" />{" "}
            {user?.energy?.current} / {user?.energy?.max}
          </h4>

          {/* Airdrop */}
          <div className="flex flex-col items-center justify-center gap-1 text-center whitespace-nowrap">
            <h4
              className={cn(
                "relative px-2 py-1 rounded-full",
                "bg-lime-500 text-black",
                "font-bold text-xs"
              )}
            >
              {Intl.NumberFormat().format(user?.airDropXp || 0)} XP
            </h4>
            <h4 className={cn("text-xs", "text-lime-500", "font-bold")}>
              +{Intl.NumberFormat().format(user?.airDropXpPerHour || 0)} XP/H
            </h4>
          </div>
        </div>
      )}
    </>
  );
});
