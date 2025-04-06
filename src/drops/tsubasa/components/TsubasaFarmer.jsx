import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { isToday } from "date-fns";
import { memo } from "react";
import TsubasaCards from "./TsubasaCards";
import TsubasaIcon from "../assets/images/icon.png?format=webp&w=80";
import TsubasaInfoDisplay from "./TsubasaInfoDisplay";
import TsubasaTasks from "./TsubasaTasks";
import useTsubasaClaimDailyRewardMutation from "../hooks/useTsubasaClaimDailyRewardMutation";

export default memo(function TsubasaFarmer() {
  const tabs = useMirroredTabs("tsubasa.farmer-tabs", ["cards", "tasks"]);
  const { authQuery } = useFarmerContext();
  const claimDailyRewardMutation = useTsubasaClaimDailyRewardMutation();

  /** Auto Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-reward",
    async function () {
      const lastUpdate = authQuery.data["user_daily_reward"]["last_update"];

      if (!isToday(lastUpdate * 1000)) {
        await claimDailyRewardMutation.mutateAsync();
        toast.success("Tsubasa - Daily Reward");
      }
    },
    [authQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={TsubasaIcon}
          alt="Tsubasa Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Tsubasa Farmer</h1>
      </div>

      {/* Info */}
      <TsubasaInfoDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"border-b-4 data-[state=active]:border-blue-500"}
      >
        {/* Cards */}
        <Tabs.Content value="cards">
          <TsubasaCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content value="tasks">
          <TsubasaTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
