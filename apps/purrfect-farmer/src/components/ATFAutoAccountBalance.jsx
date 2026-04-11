import ATFIcon from "@/assets/images/atf.png?format=webp&w=32";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { cn } from "@/utils";
import useATFBalancesQuery from "@/hooks/useATFBalancesQuery";

export default function ATFAutoAccountBalance({ account, ...props }) {
  const { address } = account;
  const { data: balances } = useATFBalancesQuery(address);

  return (
    <span
      {...props}
      className={cn(
        "flex flex-wrap items-center gap-x-2 font-bold",
        "text-neutral-500 dark:text-neutral-300",
        props.className,
      )}
    >
      <span className="inline-flex items-center gap-0.5">
        <img src={TonIcon} className="size-3" />
        {balances ? balances.ton.toFixed(4) : "-.--"}
      </span>
      <span className="inline-flex items-center gap-0.5">
        <img src={ATFIcon} className="size-3 rounded-full" />
        {balances ? balances.jetton.toFixed(2) : "-.--"}
      </span>
    </span>
  );
}
