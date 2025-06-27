import FarmerHeader from "@/components/FarmerHeader";
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
  const { authQuery, telegramUser } = useFarmerContext();
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
      <FarmerHeader
        title={"Tsubasa Farmer"}
        icon={TsubasaIcon}
        referralLink={`https://t.me/TsubasaRivalsBot/start?startapp=inviter_id-${telegramUser["id"]}`}
      />

      {/* Info */}
      <TsubasaInfoDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"data-[state=active]:border-blue-500"}
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
