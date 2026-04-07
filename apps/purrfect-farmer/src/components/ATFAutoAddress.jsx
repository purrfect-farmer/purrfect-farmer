import { cn } from "@/utils";

export default function ATFAutoAddress({ address, ...props }) {
  return (
    <span {...props} className={cn("truncate font-bold", props.className)}>
      {address.slice(0, 6)}...{address.slice(-4)}
    </span>
  );
}
