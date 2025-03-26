import StatusIcon from "@/components/StatusIcon";
import useAppContext from "@/hooks/useAppContext";
import { HiOutlineBolt } from "react-icons/hi2";

export default function CloudTelegramSessionStatus() {
  const { settings, cloudTelegramSession } = useAppContext();

  return settings.enableCloud ? (
    <StatusIcon
      title="Cloud Telegram Session"
      icon={HiOutlineBolt}
      status={cloudTelegramSession ? "success" : "pending"}
    />
  ) : null;
}
