import FarmerHeader from "@/components/FarmerHeader";
import Tabs from "@/components/Tabs";
import useFarmerAutoTab from "@/hooks/useFarmerAutoTab";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { memo } from "react";

import GoldEagleBalanceDisplay from "./GoldEagleBalanceDisplay";
import GoldEagleGamer from "./GoldEagleGamer";
import GoldEagleIcon from "../assets/images/icon.png?format=webp&w=80";
import useGoldEagleUserQuery from "../hooks/useGoldEagleUserQuery";

export default memo(function GoldEagleFarmer() {
  const tabs = useMirroredTabs("gold-eagle.farmer-tabs", ["game"]);
  const userQuery = useGoldEagleUserQuery();

  /** Automatically Switch Tab */
  useFarmerAutoTab(tabs);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <FarmerHeader
        title={"Gold Eagle Farmer"}
        icon={GoldEagleIcon}
        referralLink={userQuery.data ? userQuery.data["referral_url"] : null}
      />

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
