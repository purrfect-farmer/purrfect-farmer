import AppContext from "@/contexts/AppContext";
import StatusIcon from "@/components/StatusIcon";
import useCloudServerQuery from "@/hooks/useCloudServerQuery";
import { HiOutlineCloud } from "react-icons/hi2";
import { useContext } from "react";

export default function CloudStatus(props) {
  const { settings } = useContext(AppContext);
  const { status, data } = useCloudServerQuery();

  return settings.enableCloud ? (
    <StatusIcon
      title={data?.name || "Cloud"}
      icon={HiOutlineCloud}
      status={status}
    />
  ) : null;
}
