import { memo } from "react";
import { useEffect } from "react";

import PettIcon from "../assets/images/icon.png?format=webp&w=80";
import PettInfoDisplay from "./PettInfoDisplay";
import usePettBuyFoodMutation from "../hooks/usePettBuyFoodMutation";
import usePettCafeteriaQuery from "../hooks/usePettCafeteriaQuery";
import usePettRubMutation from "../hooks/usePettRubMutation";
import usePettSleepMutation from "../hooks/usePettSleepMutation";
import usePettStatusQuery from "../hooks/usePettStatusQuery";
import usePettTakeShowerMutation from "../hooks/usePettTakeShowerMutation";
import usePettWakeUpMutation from "../hooks/usePettWakeUpMutation";

export default memo(function PettFarmer() {
  const query = usePettStatusQuery();
  const wakeUpMutation = usePettWakeUpMutation();
  const sleepMutation = usePettSleepMutation();
  const takeShowerMutation = usePettTakeShowerMutation();
  const rubMutation = usePettRubMutation();
  const buyFoodMutation = usePettBuyFoodMutation();

  const cafeteriaQuery = usePettCafeteriaQuery({
    enabled: query.isSuccess,
  });

  /** Play Game */
  useEffect(() => {
    if (cafeteriaQuery.isSuccess) {
      (async () => {
        await buyFoodMutation.mutateAsync("🍔");
      })();
    }
  }, [cafeteriaQuery.isSuccess, cafeteriaQuery.data, query.data]);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={PettIcon}
          alt="Pett Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">PettAI Farmer</h1>
      </div>

      {/* Info */}
      <PettInfoDisplay />
    </div>
  );
});
