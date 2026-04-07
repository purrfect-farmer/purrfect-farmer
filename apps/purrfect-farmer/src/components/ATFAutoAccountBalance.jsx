import ATFIcon from "@/assets/images/atf.png?format=webp&w=32";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import useATFBalancesQuery from "@/hooks/useATFBalancesQuery";

export default function ATFAutoAccountBalance({ address }) {
  const { data: balances } = useATFBalancesQuery(address);

  if (!balances) {
    return (
      <span className="text-xs text-neutral-400">Loading balances...</span>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-300">
      <span className="inline-flex items-center gap-0.5">
        <img src={TonIcon} className="size-3" />
        {balances.ton.toFixed(4)}
      </span>
      <span className="inline-flex items-center gap-0.5">
        <img src={ATFIcon} className="size-3 rounded-full" />
        {balances.jetton.toFixed(2)}
      </span>
    </span>
  );
}
