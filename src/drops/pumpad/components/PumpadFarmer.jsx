import { useEffect } from "react";
import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";
import usePumpadCheckInQuery from "../hooks/usePumpadCheckInQuery";
import PumpadLottery from "./PumpadLottery";
import PumpadUsernameDisplay from "./PumpadUsernameDisplay";
import usePumpadCheckInMutation from "../hooks/usePumpadCheckInMutation";
import toast from "react-hot-toast";
import useSocketTabs from "@/hooks/useSocketTabs";
import PumpadMissions from "./PumpadMissions";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import PumpadBalanceDisplay from "./PumpadBalanceDisplay";
import PumpadTickets from "./PumpadTickets";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";

export default function PumpadFarmer() {
  const checkInQuery = usePumpadCheckInQuery();
  const claimCheckInMutation = usePumpadCheckInMutation();

  const tabs = useSocketTabs("pumpad.farmer-tabs", "lottery");

  /** Daily Check-In */
  useEffect(() => {
    if (!checkInQuery.data) return;
    (async function () {
      const hasClaimed = checkInQuery.data["is_check_in"];

      if (!hasClaimed) {
        await claimCheckInMutation.mutateAsync();
        toast.success("Pumpad - Check-In");
      }
    })();
  }, [checkInQuery.data]);

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs.onValueChange);

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

      <Tabs.Root {...tabs} className="flex flex-col">
        <Tabs.List className="grid grid-cols-3">
          {["lottery", "tickets", "missions"].map((value, index) => (
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
}
