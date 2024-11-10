import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";
import SlotcoinInfoDisplay from "./SlotcoinInfoDisplay";
import SlotcoinLottery from "./SlotcoinLottery";
import SlotcoinQuests from "./SlotcoinQuests";
import SlotcoinTickets from "./SlotcoinTickets";
import useSlotcoinCheckInInfoQuery from "../hooks/useSlotcoinCheckInInfoQuery";
import useSlotcoinCheckInMutation from "../hooks/useSlotcoinCheckInMutation";

export default function SlotcoinFarmer() {
  const checkInQuery = useSlotcoinCheckInInfoQuery();
  const checkInMutation = useSlotcoinCheckInMutation();

  const tabs = useSocketTabs("slotcoin.farmer-tabs", "lottery");

  useEffect(() => {
    if (!checkInQuery.data) return;
    (async function () {
      const checkIn = checkInQuery.data;

      if (checkIn["time_to_claim"] <= 0) {
        await checkInMutation.mutateAsync();
        toast.success("Slotcoin - Check-In");
      }
    })();
  }, [checkInQuery.data]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={SlotcoinIcon}
          alt="Slotcoin Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Slotcoin Farmer</h1>
      </div>

      {/* Info */}
      <SlotcoinInfoDisplay />

      <Tabs.Root {...tabs.root} className="flex flex-col">
        <Tabs.List className="grid grid-cols-3">
          {["lottery", "tickets", "quests"].map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-purple-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Lottery */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="lottery"
        >
          <SlotcoinLottery />
        </Tabs.Content>

        {/* Tickets */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tickets"
        >
          <SlotcoinTickets />
        </Tabs.Content>

        {/* Quests */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="quests"
        >
          <SlotcoinQuests />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
