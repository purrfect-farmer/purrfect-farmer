import ProfileEditorProfileForm from "@/components/ProfileEditorProfileForm";
import ProfileEditorTwoFaForm from "@/components/ProfileEditorTwoFaForm";
import Tabs from "@/components/Tabs";
import useMirroredTabs from "@/hooks/useMirroredTabs";

export default function ProfileEditor() {
  const tabs = useMirroredTabs("profile-editor", ["profile", "2fa"]);

  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto">
      <Tabs.Content value="profile">
        <ProfileEditorProfileForm />
      </Tabs.Content>

      <Tabs.Content value="2fa">
        <ProfileEditorTwoFaForm />
      </Tabs.Content>
    </Tabs>
  );
}
