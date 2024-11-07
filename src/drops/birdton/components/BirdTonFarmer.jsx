import * as Tabs from "@radix-ui/react-tabs";
import FullSpinner from "@/components/FullSpinner";
import toast from "react-hot-toast";
import useFarmerContext from "@/hooks/useFarmerContext";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

import BirdTonGamer from "./BirdTonGamer";
import BirdTonIcon from "../assets/images/icon.png?format=webp&w=80";
import BirdTonTasks from "./BirdTonTasks";
import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import EnergyIcon from "../assets/images/energy.png?format=webp&w=80";
import useBirdTonClaimDailyRewardMutation from "../hooks/useBirdTonClaimDailyRewardMutation";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";

export default function BirdTonFarmer() {
  const { connected, user } = useFarmerContext();

  const energy = user?.["energy"] || 0;
  const maxEnergy = user?.["energy_capacity"] || 0;
  const tabs = useSocketTabs("birdton.farmer-tabs", "game");

  const claimDailyRewardMutation = useBirdTonClaimDailyRewardMutation();

  /** Claim Daily Reward */
  useEffect(() => {
    (async function () {
      if (user?.["can_claim_daily"]) {
        await claimDailyRewardMutation.mutateAsync();

        toast.success("BirdTon - Daily Reward");
      }
    })();
  }, [user?.["can_claim_daily"]]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs.onValueChange);

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
        <span className="py-1.5 px-2 text-sky-500">
          <img src={EnergyIcon} className="inline w-5" /> {energy} / {maxEnergy}
        </span>
      </h4>

      <Tabs.Root {...tabs} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {["game", "tasks"].map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-sky-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {/* Game */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="game"
        >
          <BirdTonGamer />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <BirdTonTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  ) : (
    <FullSpinner />
  );
}
