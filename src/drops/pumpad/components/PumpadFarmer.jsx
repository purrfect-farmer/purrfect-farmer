import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useSocketTabs from "@/hooks/useSocketTabs";
import { cn } from "@/lib/utils";
import { memo } from "react";

import PumpadBalanceDisplay from "./PumpadBalanceDisplay";
import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";
import PumpadLottery from "./PumpadLottery";
import PumpadMissions from "./PumpadMissions";
import PumpadTickets from "./PumpadTickets";
import PumpadUsernameDisplay from "./PumpadUsernameDisplay";
import usePumpadCheckInMutation from "../hooks/usePumpadCheckInMutation";
import usePumpadCheckInQuery from "../hooks/usePumpadCheckInQuery";

export default memo(function PumpadFarmer() {
  const checkInQuery = usePumpadCheckInQuery();
  const claimCheckInMutation = usePumpadCheckInMutation();

  const tabs = useSocketTabs("pumpad.farmer-tabs", [
    "lottery",
    "tickets",
    "missions",
  ]);

  /** Daily Check-In */
  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      if (checkInQuery.data) {
        const hasClaimed = checkInQuery.data["is_check_in"];

        if (!hasClaimed) {
          return async function () {
            await claimCheckInMutation.mutateAsync();
            await checkInQuery.refetch();

            toast.success("Pumpad - Check-In");
          };
        }
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

      <Tabs.Root {...tabs.rootProps} className="flex flex-col">
        <Tabs.List className="grid grid-cols-3">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-pumpad-green-500"
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
          <PumpadLottery />
        </Tabs.Content>

        {/* Tickets */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tickets"
        >
          <PumpadTickets />
        </Tabs.Content>

        {/* Missions */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="missions"
        >
          <PumpadMissions />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
