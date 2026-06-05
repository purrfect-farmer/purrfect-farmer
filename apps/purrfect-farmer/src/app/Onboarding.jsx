import Alert from "@/components/Alert";
import AppHeader from "@/components/AppHeader";
import Connect from "@/partials/Connect";
import PrimaryButton from "@/components/PrimaryButton";
import useAppContext from "@/hooks/useAppContext";

export default function Onboarding() {
  const { dispatchAndConfigureSettings } = useAppContext();
  return (
    <div className="flex flex-col gap-2 justify-center min-h-dvh max-w-96 mx-auto p-4">
      {/* Logo + Title */}
      <AppHeader />

      {/* Warning */}
      <Alert variant={"warning"}>
        By using the farmer, you accept full responsibility for any risks to
        your account. If you receive a ban, you alone are accountable.
      </Alert>

      {/* Get Started */}
      <PrimaryButton
        className="bg-orange-500"
        onClick={() => dispatchAndConfigureSettings("onboarded", true, false)}
      >
        Get Started
      </PrimaryButton>

      {/* Connect */}
      <Connect className="hover:bg-orange-500" />
    </div>
  );
}
