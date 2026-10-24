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
import AutoSwapperTab from "./AutoSwapperTab";
import AutoVerifyTab from "./AutoVerifyTab";
import AutoWalletsTab from "./AutoWalletsTab";
import AutoWithdrawTab from "./AutoWithdrawTab";
import Tabs from "./Tabs";
import useAuto from "@/hooks/useAuto";
import { useMemo } from "react";

/** Tabs a native TON drop hides, having no jetton to swap into */
const SWAP_TABS = ["swap", "swapper"];

/** Every drop gets these, a verifiable one also gets the verify tab, and a native TON one has nothing to swap */
const baseTabs = {
  rootProps: { defaultValue: "dashboard" },
  list: [
    "dashboard",
    "boost",
    "withdraw",
    "flip",
    "rescue",
    "swap",
    "swapper",
    "parcel",
    "collect",
    "load",
    "cultivate",
    "status",
    "wallets",
  ],
};

export default function AutoPanel() {
  const { config } = useAuto();
  const tabs = useMemo(
    () => ({
      ...baseTabs,
      list: [
        ...baseTabs.list.filter(
          (tab) => !(config.native && SWAP_TABS.includes(tab)),
        ),
        ...(config.verifiable ? ["verify"] : []),
      ],
    }),
    [config.verifiable, config.native],
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
      {!config.native && (
        <Tabs.Content value="swap">
          <AutoSwapTab />
        </Tabs.Content>
      )}
      {!config.native && (
        <Tabs.Content value="swapper">
          <AutoSwapperTab />
        </Tabs.Content>
      )}
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
      <Tabs.Content value="wallets">
        <AutoWalletsTab />
      </Tabs.Content>
      {config.verifiable && (
        <Tabs.Content value="verify">
          <AutoVerifyTab />
        </Tabs.Content>
      )}
    </Tabs>
  );
}
