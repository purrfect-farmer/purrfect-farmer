import { cn } from "@/utils";

/** The colour each farmer status is shown in, as the cloud screens use */
const STATUS_COLORS = {
  active: "bg-green-500",
  frozen: "bg-sky-500",
  banned: "bg-red-500",
  inactive: "bg-orange-500",
};

export default function FarmerStatusDot({ status, className }) {
  const color = STATUS_COLORS[status];

  if (!color) return null;

  return (
    <span
      title={status}
      className={cn(
        "shrink-0 size-2 rounded-full",
        "border-2 border-white",
        color,
        className,
      )}
    />
  );
}
