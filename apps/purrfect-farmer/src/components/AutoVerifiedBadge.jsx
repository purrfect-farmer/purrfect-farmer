import { HiCheckBadge } from "react-icons/hi2";
import { cn } from "@/utils";

export default function AutoVerifiedBadge({ verified, className }) {
  if (!verified) return null;

  return (
    <HiCheckBadge
      title="Verified"
      className={cn("shrink-0 size-4 text-lime-500", className)}
    />
  );
}
