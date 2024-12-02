import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerContext from "@/hooks/useFarmerContext";
import { isToday } from "date-fns";

import useTsubasaClaimDailyRewardMutation from "../hooks/useTsubasaClaimDailyRewardMutation";

export default function TsubasaFarmer() {
  const { authQuery } = useFarmerContext();
  const claimDailyRewardMutation = useTsubasaClaimDailyRewardMutation();

  /** Auto Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    () => {
      if (authQuery.data)
        return async function () {
          const lastUpdate = authQuery.data["user_daily_reward"]["last_update"];

          if (!isToday(lastUpdate * 1000)) {
            await claimDailyRewardMutation.mutateAsync();
            toast.success("Tsubasa - Daily Reward");
          }
        };
    },
    [authQuery.data]
  );

  return (
    <div className="flex flex-col items-center justify-center min-w-0 min-h-0 gap-2 p-4 grow">
      Under Construction
    </div>
  );
}
