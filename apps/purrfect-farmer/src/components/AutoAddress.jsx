import { cn } from "@/utils";

export default function AutoAddress({ address, ...props }) {
  /** An account being imported has no wallet yet */
  if (!address) {
    return null;
  }

  return (
    <span {...props} className={cn("truncate font-bold", props.className)}>
      {address.slice(0, 6)}...{address.slice(-4)}
    </span>
  );
}
