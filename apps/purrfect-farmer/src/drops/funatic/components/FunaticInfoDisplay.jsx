import { memo } from "react";

import ChipsIcon from "../assets/images/chips.png?format=webp&w=80";
import JokerIcon from "../assets/images/joker.png?format=webp&w=80";
import useFunaticGameQuery from "../hooks/useFunaticGameQuery";

export default memo(function FunaticInfoDisplay() {
  const gameQuery = useFunaticGameQuery();
  const balance = gameQuery.data?.funz?.currentFunzBalance || 0;
  const jokers = gameQuery.data?.jokers?.balance || 0;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-center text-purple-500">
          <img src={ChipsIcon} className="inline w-5 h-5" />{" "}
          {Intl.NumberFormat().format(balance)}
        </h3>
        <h3 className="text-lg font-bold text-center text-purple-500">
          <img src={JokerIcon} className="inline w-4 h-4" />{" "}
          {Intl.NumberFormat().format(jokers)}
        </h3>
      </div>
    </>
  );
});
