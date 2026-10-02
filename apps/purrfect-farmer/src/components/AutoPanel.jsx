import AutoBoostTab from "./AutoBoostTab";
import AutoCloudCollectTab from "./AutoCloudCollectTab";
import AutoCultivateTab from "./AutoCultivateTab";
import AutoDashboardTab from "./AutoDashboardTab";
import AutoFlipTab from "./AutoFlipTab";
import AutoLoadTab from "./AutoLoadTab";
import AutoParcelTab from "./AutoParcelTab";
import AutoRescueTab from "./AutoRescueTab";
import AutoStatusTab from "./AutoStatusTab";
import AutoSwapTab from "./AutoSwapTab";
import AutoVerifyTab from "./AutoVerifyTab";
import AutoWithdrawTab from "./AutoWithdrawTab";
import Tabs from "./Tabs";
import useAuto from "@/hooks/useAuto";
import { useMemo } from "react";

/** Every drop gets these, and a verifiable one also gets the verify tab */
const baseTabs = {
  rootProps: { defaultValue: "dashboard" },
  list: [
    "dashboard",
    "boost",
    "withdraw",
    "flip",
    "rescue",
    "swap",
    "parcel",
    "collect",
    "load",
    "cultivate",
    "status",
  ],
};

export default function AutoPanel() {
  const { config } = useAuto();
  const tabs = useMemo(
    () =>
      config.verifiable
        ? { ...baseTabs, list: [...baseTabs.list, "verify"] }
        : baseTabs,
    [config.verifiable],
  );

  return (
    <Tabs
      tabs={tabs}
      rootClassName="grow overflow-auto gap-0"
      listClassName="flex overflow-x-auto"
      triggerClassName="shrink-0"
    >
      <Tabs.Content value="dashboard">
        <AutoDashboardTab />
      </Tabs.Content>
      <Tabs.Content value="boost">
        <AutoBoostTab />
      </Tabs.Content>
      <Tabs.Content value="withdraw">
        <AutoWithdrawTab />
      </Tabs.Content>
      <Tabs.Content value="flip">
        <AutoFlipTab />
      </Tabs.Content>
      <Tabs.Content value="rescue">
        <AutoRescueTab />
      </Tabs.Content>
      <Tabs.Content value="swap">
        <AutoSwapTab />
      </Tabs.Content>
      <Tabs.Content value="parcel">
        <AutoParcelTab />
      </Tabs.Content>
      <Tabs.Content value="collect">
        <AutoCloudCollectTab />
      </Tabs.Content>
      <Tabs.Content value="load">
        <AutoLoadTab />
      </Tabs.Content>
      <Tabs.Content value="cultivate">
        <AutoCultivateTab />
      </Tabs.Content>
      <Tabs.Content value="status">
        <AutoStatusTab />
      </Tabs.Content>
      {config.verifiable && (
        <Tabs.Content value="verify">
          <AutoVerifyTab />
        </Tabs.Content>
      )}
    </Tabs>
  );
}
