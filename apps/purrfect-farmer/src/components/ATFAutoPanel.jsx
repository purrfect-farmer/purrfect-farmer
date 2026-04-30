import ATFAutoBoostTab from "./ATFAutoBoostTab";
import ATFAutoCloudCollectTab from "./ATFAutoCloudCollectTab";
import ATFAutoDashboardTab from "./ATFAutoDashboardTab";
import ATFAutoSettingsTab from "./ATFAutoSettingsTab";
import ATFAutoWithdrawTab from "./ATFAutoWithdrawTab";
import Tabs from "./Tabs";

const tabs = {
  rootProps: { defaultValue: "dashboard" },
  list: ["dashboard", "boost", "withdraw", "collect", "settings"],
};

export default function ATFAutoPanel() {
  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto gap-0">
      <Tabs.Content value="dashboard">
        <ATFAutoDashboardTab />
      </Tabs.Content>
      <Tabs.Content value="boost">
        <ATFAutoBoostTab />
      </Tabs.Content>
      <Tabs.Content value="withdraw">
        <ATFAutoWithdrawTab />
      </Tabs.Content>
      <Tabs.Content value="collect">
        <ATFAutoCloudCollectTab />
      </Tabs.Content>
      <Tabs.Content value="settings">
        <ATFAutoSettingsTab />
      </Tabs.Content>
    </Tabs>
  );
}
