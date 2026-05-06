import ATFAutoBoostTab from "./ATFAutoBoostTab";
import ATFAutoCloudCollectTab from "./ATFAutoCloudCollectTab";
import ATFAutoDashboardTab from "./ATFAutoDashboardTab";
import ATFAutoStatusTab from "./ATFAutoStatusTab";
import ATFAutoWithdrawTab from "./ATFAutoWithdrawTab";
import Tabs from "./Tabs";

const tabs = {
  rootProps: { defaultValue: "dashboard" },
  list: ["dashboard", "boost", "withdraw", "collect", "status"],
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
      <Tabs.Content value="status">
        <ATFAutoStatusTab />
      </Tabs.Content>
    </Tabs>
  );
}
