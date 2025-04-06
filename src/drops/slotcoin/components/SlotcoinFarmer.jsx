import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";
import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";
import SlotcoinInfoDisplay from "./SlotcoinInfoDisplay";
import SlotcoinLottery from "./SlotcoinLottery";
import SlotcoinQuests from "./SlotcoinQuests";
import SlotcoinTickets from "./SlotcoinTickets";
import useSlotcoinCheckInInfoQuery from "../hooks/useSlotcoinCheckInInfoQuery";
import useSlotcoinCheckInMutation from "../hooks/useSlotcoinCheckInMutation";
import useSlotcoinInfoQuery from "../hooks/useSlotcoinInfoQuery";

export default memo(function SlotcoinFarmer() {
  const infoQuery = useSlotcoinInfoQuery();
  const checkInQuery = useSlotcoinCheckInInfoQuery();
  const checkInMutation = useSlotcoinCheckInMutation();

  const tabs = useMirroredTabs("slotcoin.farmer-tabs", [
    "lottery",
    "tickets",
    "quests",
  ]);

  useFarmerAsyncTask(
    "daily-check-in",
    async function () {
      const checkIn = checkInQuery.data;

      if (checkIn["time_to_claim"] <= 0) {
        /** Check-In */
        await checkInMutation.mutateAsync();

        /** Toast */
        toast.success("Slotcoin - Check-In");

        /** Refetch */
        await infoQuery.refetch();
      }
    },
    [checkInQuery.data]
  );

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

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"border-b-4 data-[state=active]:border-purple-500"}
      >
        {/* Lottery */}
        <Tabs.Content value="lottery">
          <SlotcoinLottery />
        </Tabs.Content>

        {/* Tickets */}
        <Tabs.Content value="tickets">
          <SlotcoinTickets />
        </Tabs.Content>

        {/* Quests */}
        <Tabs.Content value="quests">
          <SlotcoinQuests />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
