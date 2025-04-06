import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
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
    async function () {
      await toast.promise(digMutation.mutateAsync(), {
        loading: "Digging...",
        success: "Successfully digged...",
        error: "Can't dig now",
      });
    },
    [userQuery.isLoading === false]
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

      <Tabs
        tabs={tabs}
        rootClassName={"gap-0"}
        triggerClassName={"data-[state=active]:border-green-500"}
        className="flex flex-col"
      >
        {/* Game */}
        <Tabs.Content value="game">
          <DiggerGame />
        </Tabs.Content>

        {/* Chests */}
        <Tabs.Content value="chests">
          <DiggerChests />
        </Tabs.Content>

        {/* Cards */}
        <Tabs.Content value="cards">
          <DiggerCards />
        </Tabs.Content>

        {/* Tasks */}
        <Tabs.Content value="tasks">
          <DiggerTasks />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
