import MatchQuestFarmerHeader from "./MatchQuestFarmerHeader";
import MatchQuestUsernameDisplay from "./MatchQuestUsernameDisplay";
import MatchQuestBalanceDisplay from "./MatchQuestBalanceDisplay";
import MatchQuestTicketsDisplay from "./MatchQuestTicketsDisplay";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import MatchQuestAutoGamer from "./MatchQuestAutoGamer";
import MatchQuestAutoTasks from "./MatchQuestAutoTasks";
import useMatchQuestRewardQuery from "../hooks/useMatchQuestRewardQuery";
import useMatchQuestStartFarmingMutation from "../hooks/useMatchQuestStartFarmingMutation";
import { useEffect } from "react";
import { isAfter } from "date-fns";
import toast from "react-hot-toast";
import useMatchQuestClaimFarmingMutation from "../hooks/useMatchQuestClaimFarmingMutation";

export default function MatchQuestFarmer() {
  const tabs = useSocketTabs("matchquest.farmer-tabs", "game");

  const startFarmingMutation = useMatchQuestStartFarmingMutation();
  const claimFarmingMutation = useMatchQuestClaimFarmingMutation();
  const rewardQuery = useMatchQuestRewardQuery();

  /** Auto Start and Claim Farming */
  useEffect(() => {
    if (!rewardQuery.data) return;

    (async function () {
      const data = rewardQuery.data;

      if (data["reward"] === 0) {
        await startFarmingMutation.mutateAsync();
        toast.success("MatchQuest Started Farming");
      } else if (isAfter(new Date(), new Date(data["next_claim_timestamp"]))) {
        /** Claim Farming */
        await claimFarmingMutation.mutateAsync();
        toast.success("MatchQuest Claimed Previous Farming");

        /** Start Farming */
        await startFarmingMutation.mutateAsync();
        toast.success("MatchQuest Started Farming");
      }
    })();
  }, [rewardQuery.data]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col p-4">
      <MatchQuestFarmerHeader />
      <MatchQuestUsernameDisplay />
      <MatchQuestBalanceDisplay />
      <MatchQuestTicketsDisplay />

      <Tabs.Root {...tabs.root} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {["game", "tasks"].map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b border-transparent",
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
          <MatchQuestAutoGamer />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <MatchQuestAutoTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
