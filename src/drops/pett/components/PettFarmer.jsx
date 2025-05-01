import FarmerHeader from "@/components/FarmerHeader";
import toast from "react-hot-toast";
import { memo } from "react";
import { useEffect } from "react";

import PettIcon from "../assets/images/icon.png?format=webp&w=80";
import PettInfoDisplay from "./PettInfoDisplay";
import usePettBuyFoodMutation from "../hooks/usePettBuyFoodMutation";
import usePettCafeteriaQuery from "../hooks/usePettCafeteriaQuery";
import usePettFridgeQuery from "../hooks/usePettFridgeQuery";
import usePettRubMutation from "../hooks/usePettRubMutation";
import usePettSleepMutation from "../hooks/usePettSleepMutation";
import usePettStatusQuery from "../hooks/usePettStatusQuery";
import usePettTakeShowerMutation from "../hooks/usePettTakeShowerMutation";
import usePettWakeUpMutation from "../hooks/usePettWakeUpMutation";

export default memo(function PettFarmer() {
  const wakeUpMutation = usePettWakeUpMutation();
  const sleepMutation = usePettSleepMutation();
  const takeShowerMutation = usePettTakeShowerMutation();
  const rubMutation = usePettRubMutation();
  const buyFoodMutation = usePettBuyFoodMutation();

  const statusQuery = usePettStatusQuery();

  const stats = statusQuery.data?.stats;
  const isAwake = statusQuery.data?.state === "awake";
  const isSleeping = statusQuery.data?.state === "sleeping";

  const cafeteriaQuery = usePettCafeteriaQuery({
    enabled: isAwake,
  });

  const fridgeQuery = usePettFridgeQuery({
    enabled: cafeteriaQuery.isSuccess,
  });

  const isReady = isSleeping || fridgeQuery.isSuccess;
  const shouldWakeUp = isSleeping && stats.Energy.value > 20;
  const shouldSleep =
    isAwake &&
    stats.Energy.value <= 20 &&
    stats.Clean.value > 50 &&
    stats.Hunger.value > 30 &&
    stats.Health.value > 50;

  /** Sleep */
  useEffect(() => {
    if (isReady && shouldSleep) {
      toast.promise(sleepMutation.mutateAsync(), {
        loading: "Going to Sleep...",
        error: "Failed to Sleep!",
        success: "Pett is Sleeping!",
      });
    }
  }, [isReady, shouldSleep]);

  /** Wake Up */
  useEffect(() => {
    if (isReady && shouldWakeUp) {
      toast.promise(wakeUpMutation.mutateAsync(), {
        loading: "Waking Up...",
        error: "Failed to Wake Up!",
        success: "Pett is Awake!",
      });
    }
  }, [isReady, shouldWakeUp]);

  console.log(fridgeQuery.error, fridgeQuery.data);
  console.log(cafeteriaQuery.error, cafeteriaQuery.data);
  console.log(shouldSleep, shouldWakeUp);
  console.log(isReady);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <FarmerHeader title={"PettAI Farmer"} icon={PettIcon} />

      {/* Info */}
      <PettInfoDisplay />
    </div>
  );
});
