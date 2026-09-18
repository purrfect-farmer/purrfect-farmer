import { cn } from "@/utils";
import {
  FARMER_STATUS_DOT_COLORS,
  FARMER_STATUS_LABELS,
} from "@/constants/farmerStatus";

export default function FarmerStatusDot({ status, className }) {
  const color = FARMER_STATUS_DOT_COLORS[status];

  if (!color) return null;

  return (
    <span
      title={FARMER_STATUS_LABELS[status] ?? status}
      className={cn(
        "shrink-0 size-2.5 rounded-full",
        "border-2 border-white",
        color,
        className,
      )}
    />
  );
}
