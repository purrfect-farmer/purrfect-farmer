import ProfileEditorCleanForm from "@/components/ProfileEditorCleanForm";
import ProfileEditorProfileForm from "@/components/ProfileEditorProfileForm";
import ProfileEditorTwoFaForm from "@/components/ProfileEditorTwoFaForm";
import Tabs from "@/components/Tabs";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import useProfileEditorProfile from "@/hooks/useProfileEditorProfile";

export default function ProfileEditor() {
  const tabs = useMirroredTabs("profile-editor", ["profile", "clean", "2fa"]);
  const { profile, setProfile, mutation } = useProfileEditorProfile();

  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto">
      <Tabs.Content value="profile">
        {profile ? (
          <ProfileEditorProfileForm profile={profile} mutation={mutation} />
        ) : (
          <div className="p-2 text-center">Loading profile...</div>
        )}
      </Tabs.Content>

      <Tabs.Content value="clean">
        {profile ? (
          <ProfileEditorCleanForm profile={profile} setProfile={setProfile} />
        ) : (
          <div className="p-2 text-center">Loading profile...</div>
        )}
      </Tabs.Content>

      <Tabs.Content value="2fa">
        <ProfileEditorTwoFaForm />
      </Tabs.Content>
    </Tabs>
  );
}
