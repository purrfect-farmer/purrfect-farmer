import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import * as Tabs from "@radix-ui/react-tabs";
import useRektDailyCheckInMutation from "../hooks/useRektDailyCheckInMutation";
import { cn, delay } from "@/lib/utils";
import RektFarmerHeader from "./RektFarmerHeader";
import RektUsernameDisplay from "./RektUsernameDisplay";
import RektBalanceDisplay from "./RektBalanceDisplay";
import RektAutoQuests from "./RektAutoQuests";
import useRektUnclaimedFarmingQuery from "../hooks/useRektUnclaimedFarmingQuery";
import useRektActiveFarmingQuery from "../hooks/useRektActiveFarmingQuery";
import toast from "react-hot-toast";
import useRektClaimFarmingMutation from "../hooks/useRektClaimFarmingMutation";
import useRektUserQuery from "../hooks/useRektUserQuery";
import useRektStartFarmingMutation from "../hooks/useRektStartFarmingMutation";
import useRektBoostFarmingMutation from "../hooks/useRektBoostFarmingMutation";
import useRektReferralClaimsQuery from "../hooks/useRektReferralClaimsQuery";
import useRektClaimReferralTradeMutation from "../hooks/useRektClaimReferralTradeMutation";
import useRektClaimReferralPointsMutation from "../hooks/useRektClaimReferralPointsMutation";
import { isAfter, subHours } from "date-fns";

export default function RektFarmer() {
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
            toast.success("Rekt - Daily Check-In");
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
          } else if (!activeFarmingQuery.data) {
            /** Start Farming */
            await startFarmingMutation.mutateAsync();
            toast.success("Rekt -  Started Farming");

            /** Refetch */
            await activeFarmingQuery.refetch();
            await unclaimedFarmingQuery.refetch();
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
          const claims = referralClaimsQuery.data;

          /** Check if time is due */
          const canClaimNow = (time) =>
            !time || isAfter(subHours(new Date(), 2), new Date(time));

          /** Claim Points */
          if (
            claims.referredPointsToClaim &&
            canClaimNow(claims.referralPointsClaimedLastTime)
          ) {
            await claimReferralPointsMutation.mutateAsync();
            toast.success("Rekt - Claimed Referral Points");
          }

          /** Claim Trades */
          if (
            claims.referredTradesToClaim &&
            canClaimNow(claims.referralTradesClaimedLastTime)
          ) {
            await claimReferralTradeMutation.mutateAsync();
            toast.success("Rekt - Claimed Referral Trades");
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
        ></Tabs.Content>
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
}
