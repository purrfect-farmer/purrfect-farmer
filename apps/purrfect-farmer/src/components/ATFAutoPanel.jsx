import ATFAutoBoostTab from "./ATFAutoBoostTab";
import ATFAutoCollectTab from "./ATFAutoCollectTab";
import ATFAutoDashboardTab from "./ATFAutoDashboardTab";
import ATFAutoSettingsTab from "./ATFAutoSettingsTab";
import Container from "./Container";
import Tabs from "./Tabs";

const tabs = {
  rootProps: { defaultValue: "dashboard" },
  list: ["dashboard", "boost", "collect", "settings"],
};

export default function ATFAutoPanel() {
  return (
    <Tabs tabs={tabs}>
      <Container className="p-0">
        <Tabs.Content value="dashboard">
          <ATFAutoDashboardTab />
        </Tabs.Content>
        <Tabs.Content value="boost">
          <ATFAutoBoostTab />
        </Tabs.Content>
        <Tabs.Content value="collect">
          <ATFAutoCollectTab />
        </Tabs.Content>
        <Tabs.Content value="settings">
          <ATFAutoSettingsTab />
        </Tabs.Content>
      </Container>
    </Tabs>
  );
}
