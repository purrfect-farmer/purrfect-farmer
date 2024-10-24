import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import { useEffect } from "react";
import { useState } from "react";

import TomarketAutoGamer from "./TomarketAutoGamer";
import TomarketBalanceDisplay from "./TomarketBalanceDisplay";
import TomarketFarmerHeader from "./TomarketFarmerHeader";
import useTomarketDailyCheckInMutation from "../hooks/useTomarketDailyCheckInMutation";
import useTomarketDailyCombo from "../hooks/useTomarketDailyCombo";
import { getTomarketGame } from "../lib/utils";

export default function TomarketFarmer() {
  const [tomarket, setTomarket] = useState(null);
  const dailyCheckInMutation = useTomarketDailyCheckInMutation();

  /** Get Tomarket ID */
  useEffect(() => {
    (async function () {
      const result = await getTomarketGame();
      setTomarket(result);
    })();
  }, []);

  /** Daily Check-In */
  useEffect(() => {
    if (!tomarket) {
      return;
    }

    (async function () {
      const result = await dailyCheckInMutation.mutateAsync(tomarket.daily);

      if (result.message === "") {
        toast.success("Tomarket Daily Check-In");
      }
    })();
  }, [tomarket]);

  /** Daily Combo */
  useTomarketDailyCombo();

  return tomarket ? (
    <div className="flex flex-col p-4">
      <TomarketFarmerHeader />
      <TomarketBalanceDisplay />

      <TomarketAutoGamer tomarket={tomarket} />
    </div>
  ) : (
    <div className="flex items-center justify-center grow">
      <CgSpinner className="w-5 h-5 mx-auto animate-spin text-rose-500" />
    </div>
  );
}
