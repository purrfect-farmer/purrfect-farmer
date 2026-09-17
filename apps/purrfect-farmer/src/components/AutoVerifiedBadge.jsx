import { HiCheckBadge } from "react-icons/hi2";
import { cn } from "@/utils";

export default function AutoVerifiedBadge({
  verified,
  title = "Verified",
  className,
}) {
  if (!verified) return null;

  return (
    <HiCheckBadge
      title={title}
      className={cn("shrink-0 size-4 text-lime-500", className)}
    />
  );
}
