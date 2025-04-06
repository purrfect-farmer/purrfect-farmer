import Tabs from "@/components/Tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";

import GoldEagleBalanceDisplay from "./GoldEagleBalanceDisplay";
import GoldEagleGamer from "./GoldEagleGamer";
import GoldEagleIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function GoldEagleFarmer() {
  const tabs = useMirroredTabs("gold-eagle.farmer-tabs", ["game"]);

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img
          src={GoldEagleIcon}
          alt="Gold Eagle Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Gold Eagle Farmer</h1>
      </div>

      <>
        <GoldEagleBalanceDisplay />

        <Tabs
          tabs={tabs}
          rootClassName={"gap-4"}
          triggerClassName={"data-[state=active]:border-orange-500"}
          className="flex flex-col gap-4"
        >
          {/* Game */}
          <Tabs.Content value="game">
            <GoldEagleGamer />
          </Tabs.Content>
        </Tabs>
      </>
    </div>
  );
});
