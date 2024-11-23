import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";

import GoatsBalanceDisplay from "./GoatsBalanceDisplay";
import GoatsIcon from "../assets/images/icon.png?format=webp&w=80";
import GoatsMissions from "./GoatsMissions";
import useGoatsCheckInMutation from "../hooks/useGoatsCheckInMutation";
import useGoatsCheckInQuery from "../hooks/useGoatsCheckInQuery";

export default function GoatsFarmer() {
  const checkInQuery = useGoatsCheckInQuery();
  const checkInMutation = useGoatsCheckInMutation();

  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      if (checkInQuery.data)
        return async function () {
          const checkIn = checkInQuery.data;
          const result = checkIn.result;

          if (!isToday(new Date(checkIn.lastCheckinTime))) {
            const day = result.find((item) => !item.status);
            await checkInMutation.mutateAsync(day["_id"]);
            toast.success("Goats Daily Check-In");
          }
        };
    },
    [checkInQuery.data]
  );

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img src={GoatsIcon} alt="Goats Farmer" className="w-8 h-8" />
        <h1 className="font-bold">Goats Farmer</h1>
      </div>

      {/* Balance Display */}
      <GoatsBalanceDisplay />

      <Tabs.Root defaultValue="missions" className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-1">
          {["missions"].map((value, index) => (
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
          value="missions"
        >
          <GoatsMissions />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
