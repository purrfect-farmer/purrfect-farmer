import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { cn } from "@/utils";
import useAuto from "@/hooks/useAuto";
import useAutoBalancesQuery from "@/hooks/useAutoBalancesQuery";

export default function AutoAccountBalance({ account, ...props }) {
  const { address } = account;
  const { config } = useAuto();
  const { data: balances } = useAutoBalancesQuery(address);
  const hasTon = balances?.ton?.greaterThan(0);
  const hasJetton = balances?.jetton?.greaterThan(0);

  return (
    <span
      {...props}
      className={cn(
        "flex flex-wrap items-center gap-x-2 font-bold",
        "text-neutral-500 dark:text-neutral-300",
        props.className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          hasTon ? "text-green-500 dark:text-green-400" : null,
        )}
      >
        <img src={TonIcon} className="size-3" />
        {balances ? balances.ton.toFixed(4) : "-.--"}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          hasJetton ? "text-green-500 dark:text-green-400" : null,
        )}
      >
        <img src={config.tokenIcon} className="size-3 rounded-full" />
        {balances ? balances.jetton.toFixed(2) : "-.--"}
      </span>
    </span>
  );
}
