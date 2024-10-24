import useFarmerContext from "@/hooks/useFarmerContext";
import { cn } from "@/lib/utils";

export default function PumpadUsernameDisplay() {
  const { userRequest } = useFarmerContext();

  return (
    <h4 className={cn("text-center")}>
      {!userRequest.data
        ? "Detecting username..."
        : userRequest.data["user_name"]}
    </h4>
  );
}
