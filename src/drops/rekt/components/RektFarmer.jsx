import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn, delay } from "@/lib/utils";
import { isAfter, subHours } from "date-fns";
import { memo } from "react";

import RektAutoGame from "./RektAutoGame";
import RektAutoQuests from "./RektAutoQuests";
import RektBalanceDisplay from "./RektBalanceDisplay";
import RektFarmerHeader from "./RektFarmerHeader";
import RektUsernameDisplay from "./RektUsernameDisplay";
import useRektActiveFarmingQuery from "../hooks/useRektActiveFarmingQuery";
import useRektBoostFarmingMutation from "../hooks/useRektBoostFarmingMutation";
import useRektClaimFarmingMutation from "../hooks/useRektClaimFarmingMutation";
import useRektClaimReferralPointsMutation from "../hooks/useRektClaimReferralPointsMutation";
import useRektClaimReferralTradeMutation from "../hooks/useRektClaimReferralTradeMutation";
import useRektDailyCheckInMutation from "../hooks/useRektDailyCheckInMutation";
import useRektReferralClaimsQuery from "../hooks/useRektReferralClaimsQuery";
import useRektStartFarmingMutation from "../hooks/useRektStartFarmingMutation";
import useRektUnclaimedFarmingQuery from "../hooks/useRektUnclaimedFarmingQuery";
import useRektUserQuery from "../hooks/useRektUserQuery";

export default memo(function RektFarmer() {
  const tabs = useSocketTabs("rekt.farmer-tabs", ["game", "quests"]);
  const dailyCheckInMutation = useRektDailyCheckInMutation();

  const userQuery = useRektUserQuery();
  const activeFarmingQuery = useRektActiveFarmingQuery();
  const unclaimedFarmingQuery = useRektUnclaimedFarmingQuery();
  const referralClaimsQuery = useRektReferralClaimsQuery();

  const startFarmingMutation = useRektStartFarmingMutation();
  const claimFarmingMutation = useRektClaimFarmingMutation();
  const boostFarmingMutation = useRektBoostFarmingMutation();

  const claimReferralTradeMutation = useRektClaimReferralTradeMutation();
  const claimReferralPointsMutation = useRektClaimReferralPointsMutation();

  /** Daily Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      return async function () {
        try {
          const { result } = await dailyCheckInMutation.mutateAsync();
          if (result === "REWARDED") {
            /** Toast */
            toast.success("Rekt - Daily Check-In");

            /** Refetch */
            await userQuery.refetch();
          }
        } catch {}
      };
    },
    []
  );

  /** Auto Farming */
  useFarmerAsyncTask(
    "farming",
    () => {
      if (unclaimedFarmingQuery.data && activeFarmingQuery.isSuccess) {
        return async function () {
          const unclaimedFarming = unclaimedFarmingQuery.data;
          if (unclaimedFarming.length) {
            for (const farming of unclaimedFarming) {
              /** Claim Farming */
              await claimFarmingMutation.mutateAsync(farming.externalId);
              toast.success("Rekt -  Claimed Farming");
            }

            /** Delay */
            await delay(1000);

            /** Start Farming */
            await startFarmingMutation.mutateAsync();
            toast.success("Rekt -  Started Farming");

            /** Refetch */
            await activeFarmingQuery.refetch();
            await unclaimedFarmingQuery.refetch();
            await userQuery.refetch();
          } else if (!activeFarmingQuery.data) {
            /** Start Farming */
            await startFarmingMutation.mutateAsync();
            toast.success("Rekt -  Started Farming");

            /** Refetch */
            await activeFarmingQuery.refetch();
            await unclaimedFarmingQuery.refetch();
            await userQuery.refetch();
          }
        };
      }
    },
    [
      unclaimedFarmingQuery.data,
      activeFarmingQuery.isSuccess,
      activeFarmingQuery.data,
    ]
  );

  /** Auto-Boost Farming */
  useFarmerAsyncTask(
    "boost-farming",
    () => {
      if (userQuery.data && activeFarmingQuery.data) {
        return async function () {
          const { balance } = userQuery.data;
          const { boostApplicationTime } = activeFarmingQuery.data;

          if (balance.boosts >= 1 && !boostApplicationTime) {
            /** Boost Farming */
            await boostFarmingMutation.mutateAsync();
            toast.success("Rekt -  Boosted Farming");

            /** Refetch */
            await activeFarmingQuery.refetch();
            await userQuery.refetch();
          }
        };
      }
    },
    [userQuery.data, activeFarmingQuery.data]
  );

  /** Auto-Claim Referrals */
  useFarmerAsyncTask(
    "claim-referrals",
    () => {
      if (referralClaimsQuery.data) {
        return async function () {
          /** Claims */
          const claims = referralClaimsQuery.data;

          /** Check if time is due */
          const canClaimNow = (time) =>
            !time || isAfter(subHours(new Date(), 2), new Date(time));

          /** Status */
          let hasClaimed = false;

          /** Claim Points */
          if (
            claims.referredPointsToClaim &&
            canClaimNow(claims.referralPointsClaimedLastTime)
          ) {
            /** Claim */
            await claimReferralPointsMutation.mutateAsync();

            /** Toast */
            toast.success("Rekt - Claimed Referral Points");

            /** Set Status */
            hasClaimed = true;
          }

          /** Claim Trades */
          if (
            claims.referredTradesToClaim &&
            canClaimNow(claims.referralTradesClaimedLastTime)
          ) {
            /** Claim */
            await claimReferralTradeMutation.mutateAsync();

            /** Toast */
            toast.success("Rekt - Claimed Referral Trades");

            /** Set Status */
            hasClaimed = true;
          }

          /** Refetch After Claiming */
          if (hasClaimed) {
            await userQuery.refetch();
            await referralClaimsQuery.refetch();
          }
        };
      }
    },
    [referralClaimsQuery.data]
  );

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <RektFarmerHeader />
      <RektUsernameDisplay />
      <RektBalanceDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-2 border-transparent",
                "data-[state=active]:border-white"
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
          <RektAutoGame />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="quests"
        >
          <RektAutoQuests />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
