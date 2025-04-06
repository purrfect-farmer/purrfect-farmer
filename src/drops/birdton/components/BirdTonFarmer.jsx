import FullSpinner from "@/components/FullSpinner";
import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useFarmerContext from "@/hooks/useFarmerContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";
import BirdTonGamer from "./BirdTonGamer";
import BirdTonIcon from "../assets/images/icon.png?format=webp&w=80";
import BirdTonTasks from "./BirdTonTasks";
import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import EnergyIcon from "../assets/images/energy.png?format=webp&w=80";
import useBirdTonClaimDailyRewardMutation from "../hooks/useBirdTonClaimDailyRewardMutation";

export default memo(function BirdTonFarmer() {
  const { connected, user } = useFarmerContext();

  const energy = user?.["energy"] || 0;
  const maxEnergy = user?.["energy_capacity"] || 0;
  const tabs = useMirroredTabs("birdton.farmer-tabs", ["game", "tasks"]);

  const claimDailyRewardMutation = useBirdTonClaimDailyRewardMutation();

  /** Claim Daily Reward */
  useFarmerAsyncTask(
    "daily-check-in",
    async function () {
      if (user?.["can_claim_daily"]) {
        await claimDailyRewardMutation.mutateAsync();
        toast.success("BirdTon - Daily Reward");
      }
    },
    []
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return user && connected ? (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img
          src={BirdTonIcon}
          alt="BirdTON Farmer"
          className="w-5 h-5 rounded-full"
        />
        <h1 className="font-bold">BirdTON Farmer</h1>
      </div>

      {/* Balance */}
      <h3 className="flex items-center justify-center gap-2 text-3xl font-bold text-center">
        <img src={CoinIcon} className="inline w-9 h-9" />{" "}
        {Intl.NumberFormat().format(user["balance"])}
      </h3>

      <h4 className="flex justify-center text-sm font-bold text-center">
        <span className="py-1.5 px-2 text-sky-100">
          <img src={EnergyIcon} className="inline w-5" /> {energy} / {maxEnergy}
        </span>
      </h4>

      <Tabs
        tabs={tabs}
        rootClassName={"gap-4"}
        triggerClassName={"border-b-4 data-[state=active]:border-sky-100"}
      >
        {/* Game */}
        <Tabs.Content value="game">
          <BirdTonGamer />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content value="tasks">
          <BirdTonTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  ) : (
    <FullSpinner />
  );
});
