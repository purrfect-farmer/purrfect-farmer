import ATFAutoCollectTab from "./ATFAutoCollectTab";
import ATFAutoDashboardTab from "./ATFAutoDashboardTab";
import ATFAutoSettingsTab from "./ATFAutoSettingsTab";
import Container from "./Container";
import Tabs from "./Tabs";
import useMirroredTabs from "@/hooks/useMirroredTabs";

export default function ATFAutoPanel() {
  const tabs = useMirroredTabs(
    "atf-auto-panel-tabs",
    ["dashboard", "collect", "settings"],
    "dashboard",
  );
  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto gap-0">
      <Container className="p-0 flex flex-col grow overflow-auto">
        <Tabs.Content value="dashboard">
          <ATFAutoDashboardTab />
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
