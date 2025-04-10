import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import MidasAutoGamer from "./MidasAutoGamer";
import MidasAutoTasks from "./MidasAutoTasks";
import MidasBalanceDisplay from "./MidasBalanceDisplay";
import MidasFarmerHeader from "./MidasFarmerHeader";
import MidasUsernameDisplay from "./MidasUsernameDisplay";
import useMidasClaimReferralRewardsMutation from "../hooks/useMidasClaimReferralRewardsMutation";
import useMidasDailyCheckInMutation from "../hooks/useMidasDailyCheckInMutation";
import useMidasReferralStatusQuery from "../hooks/useMidasReferralStatusQuery";
import useMidasStreakQuery from "../hooks/useMidasStreakQuery";
import useMidasUserQuery from "../hooks/useMidasUserQuery";
import useMidasVisitMutation from "../hooks/useMidasVisitMutation";

export default memo(function MidasFarmer() {
  const tabs = useMirroredTabs("midas.farmer-tabs", ["game", "tasks"]);
  const queryClient = useQueryClient();

  const userQuery = useMidasUserQuery();
  const streakQuery = useMidasStreakQuery();
  const referralStatusQuery = useMidasReferralStatusQuery();
  const dailyCheckInMutation = useMidasDailyCheckInMutation();
  const visitMutation = useMidasVisitMutation();
  const claimReferralRewardsMutation = useMidasClaimReferralRewardsMutation();

  /** Visit */
  useFarmerAsyncTask(
    "visit",
    async function () {
      const { isFirstVisit } = streakQuery.data;

      if (isFirstVisit) {
        const result = await visitMutation.mutateAsync();

        /** Update Data */
        queryClient.setQueryData(["midas", "user"], () => result);

        /** Toast */
        toast.success("Midas - Visited");
      }
    },
    [streakQuery.data]
  );

  /** Daily-Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    async function () {
      const { claimable } = streakQuery.data;

      if (claimable) {
        const result = await dailyCheckInMutation.mutateAsync();

        /** Update Data */
        queryClient.setQueryData(["midas", "streak"], () => result);

        /** Toast */
        toast.success("Midas - Daily Check-In");

        /** Refetch */
        await userQuery.refetch();
      }
    },
    [streakQuery.data]
  );

  /** Claim Referral Rewards */
  useFarmerAsyncTask(
    "claim-referral-rewards",
    async function () {
      const { canClaim } = referralStatusQuery.data;

      if (canClaim) {
        await claimReferralRewardsMutation.mutateAsync();

        /** Toast */
        toast.success("Midas - Referral Rewards");

        /** Refetch */
        await userQuery.refetch();
      }
    },
    [referralStatusQuery.data]
  );

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <MidasFarmerHeader />
      <MidasUsernameDisplay />
      <MidasBalanceDisplay />

      <Tabs
        tabs={tabs}
        triggerClassName={"data-[state=active]:border-orange-500"}
      >
        <Tabs.Content value="game">
          <MidasAutoGamer />
        </Tabs.Content>

        <Tabs.Content value="tasks">
          <MidasAutoTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
