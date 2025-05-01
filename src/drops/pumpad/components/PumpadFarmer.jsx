import FarmerHeader from "@/components/FarmerHeader";
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
import usePumpadUserQuery from "../hooks/usePumpadUserQuery";

export default memo(function PumpadFarmer() {
  const checkInQuery = usePumpadCheckInQuery();
  const claimCheckInMutation = usePumpadCheckInMutation();
  const userQuery = usePumpadUserQuery();

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
      <FarmerHeader
        title={"Pumpad Farmer"}
        icon={PumpadIcon}
        referralLink={
          userQuery.data
            ? `https://t.me/Pumpad_Bot/Lucky?startapp=${userQuery.data["code"]}`
            : null
        }
      />

      {/* Username */}
      <PumpadUsernameDisplay />

      {/* Balance */}
      <PumpadBalanceDisplay />

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"data-[state=active]:border-pumpad-green-500"}
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
