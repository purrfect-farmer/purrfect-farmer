import { memo } from "react";
import { useEffect } from "react";

import PettIcon from "../assets/images/icon.png?format=webp&w=80";
import PettInfoDisplay from "./PettInfoDisplay";
import usePettBuyFoodMutation from "../hooks/usePettBuyFoodMutation";
import usePettCafeteriaQuery from "../hooks/usePettCafeteriaQuery";
import usePettStatusQuery from "../hooks/usePettStatusQuery";
import usePettWakeUpMutation from "../hooks/usePettWakeUpMutation";

export default memo(function PettFarmer() {
  const query = usePettStatusQuery();
  const wakeUpMutation = usePettWakeUpMutation();
  const buyMutation = usePettBuyFoodMutation();

  const cafeteriaQuery = usePettCafeteriaQuery({
    enabled: query.isSuccess,
  });

  /** Play Game */
  useEffect(() => {
    if (query.isSuccess) {
      (async () => {})();
    }
  }, [query.isSuccess, query.data]);

  console.log(cafeteriaQuery.data);

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
