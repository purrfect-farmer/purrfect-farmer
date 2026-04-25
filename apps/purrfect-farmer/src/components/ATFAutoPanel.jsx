import ATFAutoCollectTab from "./ATFAutoCollectTab";
import ATFAutoDashboardTab from "./ATFAutoDashboardTab";
import ATFAutoSettingsTab from "./ATFAutoSettingsTab";
import Tabs from "./Tabs";

const tabs = {
  rootProps: { defaultValue: "dashboard" },
  list: ["dashboard", "collect", "settings"],
};

export default function ATFAutoPanel() {
  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto gap-0">
      <Tabs.Content value="dashboard">
        <ATFAutoDashboardTab />
      </Tabs.Content>
      <Tabs.Content value="collect">
        <ATFAutoCollectTab />
      </Tabs.Content>
      <Tabs.Content value="settings">
        <ATFAutoSettingsTab />
      </Tabs.Content>
    </Tabs>
  );
}
