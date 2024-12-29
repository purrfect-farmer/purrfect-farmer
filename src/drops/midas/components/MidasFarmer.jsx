import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";
import { memo } from "react";

import MidasAutoGamer from "./MidasAutoGamer";
import MidasAutoTasks from "./MidasAutoTasks";
import MidasBalanceDisplay from "./MidasBalanceDisplay";
import MidasFarmerHeader from "./MidasFarmerHeader";
import MidasUsernameDisplay from "./MidasUsernameDisplay";
import useMidasDailyCheckInMutation from "../hooks/useMidasDailyCheckInMutation";
import useMidasStreakQuery from "../hooks/useMidasStreakQuery";
import { useQueryClient } from "@tanstack/react-query";
import useMidasVisitMutation from "../hooks/useMidasVisitMutation";
import useMidasUserQuery from "../hooks/useMidasUserQuery";
import useMidasReferralStatusQuery from "../hooks/useMidasReferralStatusQuery";
import useMidasClaimReferralRewardsMutation from "../hooks/useMidasClaimReferralRewardsMutation";

export default memo(function MidasFarmer() {
  const tabs = useSocketTabs("midas.farmer-tabs", ["game", "tasks"]);
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
    () => {
      if (userQuery.data) {
        return async function () {
          const { isFirstVisit } = streakQuery.data;

          if (isFirstVisit) {
            const result = await visitMutation.mutateAsync();

            /** Update Data */
            queryClient.setQueryData(["midas", "user"], () => result);

            /** Toast */
            toast.success("Midas - Visited");
          }
        };
      }
    },
    [streakQuery.data]
  );

  /** Daily-Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      if (streakQuery.data) {
        return async function () {
          const { claimable } = streakQuery.data;

          if (claimable) {
            const result = await dailyCheckInMutation.mutateAsync();

            /** Update Data */
            queryClient.setQueryData(["midas", "streak"], () => result);

            /** Toast */
            toast.success("Midas Daily Check-In");
          }
        };
      }
    },
    [streakQuery.data]
  );

  /** Claim Referral Rewards */
  useFarmerAsyncTask(
    "claim-referral-rewards",
    () => {
      if (referralStatusQuery.data) {
        return async function () {
          const { canClaim } = referralStatusQuery.data;

          if (canClaim) {
            await claimReferralRewardsMutation.mutateAsync();

            /** Toast */
            toast.success("Midas Daily Check-In");
          }
        };
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

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-2 border-transparent",
                "data-[state=active]:border-orange-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="game"
        >
          <MidasAutoGamer />
        </Tabs.Content>

        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <MidasAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
