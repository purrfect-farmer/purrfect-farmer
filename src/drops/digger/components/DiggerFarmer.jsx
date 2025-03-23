import * as Tabs from "@radix-ui/react-tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { cn } from "@/lib/utils";
import { memo } from "react";

import DiggerCards from "./DiggerCards";
import DiggerChests from "./DiggerChests";
import DiggerGame from "./DiggerGame";
import DiggerIcon from "../assets/images/icon.png?format=webp&w=80";
import DiggerInfoDisplay from "./DiggerInfoDisplay";
import DiggerTasks from "./DiggerTasks";
import useDiggerDigMutation from "../hooks/useDiggerDigMutation";
import useDiggerUserQuery from "../hooks/useDiggerUserQuery";

export default memo(function DiggerFarmer() {
  const tabs = useMirroredTabs("digger.farmer-tabs", [
    "game",
    "chests",
    "cards",
    "tasks",
  ]);

  const userQuery = useDiggerUserQuery();
  const digMutation = useDiggerDigMutation();

  /** Dig */
  useFarmerAsyncTask(
    "dig",
    () => {
      if (userQuery.data) {
        return async function () {
          await toast.promise(digMutation.mutateAsync(), {
            loading: "Digging...",
            success: "Successfully digged...",
            error: "Can't dig now",
          });
        };
      }
    },
    [userQuery.data]
  );

  /** Switch Tab Automatically */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={DiggerIcon}
          alt="Digger Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Digger Farmer</h1>
      </div>

      {/* Info */}
      <DiggerInfoDisplay />

      <Tabs.Root {...tabs.rootProps} className="flex flex-col">
        <Tabs.List className="grid grid-cols-4">
          {tabs.list.map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-green-500"
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
          <DiggerGame />
        </Tabs.Content>

        {/* Chests */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="chests"
        >
          <DiggerChests />
        </Tabs.Content>

        {/* Cards */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="cards"
        >
          <DiggerCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content
          forceMount
          className="data-[state=inactive]:hidden"
          value="tasks"
        >
          <DiggerTasks />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
});
