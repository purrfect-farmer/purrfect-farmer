import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";
import PumpadBalanceDisplay from "./PumpadBalanceDisplay";
import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";
import PumpadLottery from "./PumpadLottery";
import PumpadMissions from "./PumpadMissions";
import PumpadPoints from "./PumpadPoints";
import PumpadTickets from "./PumpadTickets";
import PumpadUsernameDisplay from "./PumpadUsernameDisplay";
import usePumpadCheckInMutation from "../hooks/usePumpadCheckInMutation";
import usePumpadCheckInQuery from "../hooks/usePumpadCheckInQuery";

export default memo(function PumpadFarmer() {
  const checkInQuery = usePumpadCheckInQuery();
  const claimCheckInMutation = usePumpadCheckInMutation();

  const tabs = useMirroredTabs("pumpad.farmer-tabs", [
    "lottery",
    "tickets",
    "missions",
    "points",
  ]);

  /** Daily Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    async function () {
      const hasClaimed = checkInQuery.data["is_check_in"];

      if (!hasClaimed) {
        await claimCheckInMutation.mutateAsync();
        toast.success("Pumpad - Check-In");
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
          src={PumpadIcon}
          alt="Pumpad Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Pumpad Farmer</h1>
      </div>

      {/* Username */}
      <PumpadUsernameDisplay />

      {/* Balance */}
      <PumpadBalanceDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={
          "border-b-4 data-[state=active]:border-pumpad-green-500"
        }
      >
        {/* Lottery */}
        <Tabs.Content value="lottery">
          <PumpadLottery />
        </Tabs.Content>

        {/* Tickets */}
        <Tabs.Content value="tickets">
          <PumpadTickets />
        </Tabs.Content>

        {/* Missions */}
        <Tabs.Content value="missions">
          <PumpadMissions />
        </Tabs.Content>

        {/* Points */}
        <Tabs.Content value="points">
          <PumpadPoints />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
