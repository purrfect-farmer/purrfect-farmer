import useAppContext from "@/hooks/useAppContext";
import { HiOutlineBolt } from "react-icons/hi2";
import { cn } from "@/lib/utils";

export default function CloudTelegramSessionStatus() {
  const { settings, cloudTelegramSession } = useAppContext();

  return settings.enableCloud ? (
    <p
      className={cn(
        "text-center flex items-center justify-center gap-2",
        cloudTelegramSession ? "text-green-500" : "text-orange-500"
      )}
    >
      <HiOutlineBolt className="w-4 h-4" /> Cloud Telegram Session:{" "}
      {cloudTelegramSession ? "Logged In" : "Logged Out"}
    </p>
  ) : null;
}
