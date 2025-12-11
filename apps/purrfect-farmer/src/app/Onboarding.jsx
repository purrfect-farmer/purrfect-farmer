import Alert from "@/components/Alert";
import Connect from "@/partials/Connect";
import PrimaryButton from "@/components/PrimaryButton";
import WelcomeIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=224";
import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/utils";

export default function Onboarding() {
  const { dispatchAndConfigureSettings } = useAppContext();
  return (
    <div className="flex flex-col gap-2 justify-center min-h-dvh max-w-96 mx-auto p-4">
      {/* App Icon */}
      <img src={WelcomeIcon} className="mx-auto h-28" />

      {/* App Title */}
      <h3
        className={cn(
          "leading-none font-turret-road",
          "text-2xl text-center",
          "text-orange-500"
        )}
      >
        {import.meta.env.VITE_APP_NAME}{" "}
      </h3>

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
