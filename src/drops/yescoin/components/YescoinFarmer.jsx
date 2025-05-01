import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { CgSpinner } from "react-icons/cg";
import { memo } from "react";

import YescoinBalanceDisplay from "./YescoinBalanceDisplay";
import YescoinDailyMission from "./YescoinDailyMission";
import YescoinIcon from "../assets/images/icon.png?format=webp&w=80";
import YescoinTasks from "./YescoinTasks";
import useYescoinAccountInfoQuery from "../hooks/useYescoinAccountInfoQuery";
import useYescoinDailyCheckIn from "../hooks/useYescoinDailyCheckIn";
import useYescoinInviteGiftBoxInfoQuery from "../hooks/useYescoinInviteGiftBoxInfoQuery";
import useYescoinOfflineQuery from "../hooks/useYescoinOfflineQuery";
import useYescoinSpecialBoxClaim from "../hooks/useYescoinSpecialBoxClaim";
import useYescoinTaskBonusClaim from "../hooks/useYescoinTaskBonusClaim";

export default memo(function YescoinFarmer() {
  const accountInfoQuery = useYescoinAccountInfoQuery();
  const tabs = useMirroredTabs("yescoin.farmer-tabs", ["missions", "tasks"]);
  const inviteGiftBoxInfoQuery = useYescoinInviteGiftBoxInfoQuery();

  useYescoinDailyCheckIn();
  useYescoinSpecialBoxClaim();
  useYescoinTaskBonusClaim();
  useYescoinOfflineQuery();

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <FarmerHeader
        title={"Yescoin Farmer"}
        icon={YescoinIcon}
        referralLink={
          inviteGiftBoxInfoQuery.data
            ? `https://t.me/theYescoin_bot/Yescoin?startapp=${inviteGiftBoxInfoQuery.data["inviteCode"]}`
            : null
        }
      />

      {accountInfoQuery.isSuccess ? (
        <>
          <YescoinBalanceDisplay />
          <Tabs
            tabs={tabs}
            rootClassName={"gap-4"}
            triggerClassName={"data-[state=active]:border-orange-500"}
          >
            {/* Daily Mission */}
            <Tabs.Content value="missions">
              <YescoinDailyMission />
            </Tabs.Content>

            {/* Tasks */}
            <Tabs.Content value="tasks">
              <YescoinTasks />
            </Tabs.Content>
          </Tabs>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
});
