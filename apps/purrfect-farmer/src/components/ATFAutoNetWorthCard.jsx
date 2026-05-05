import ATFIcon from "@/assets/images/atf.png?format=webp&w=32";
import Decimal from "decimal.js";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { cn } from "@/utils";
import useATFNetWorthQuery from "@/hooks/useATFNetWorthQuery";
import { useMemo } from "react";

export function ATFAutoNetWorthCard() {
  const { isSuccess, data } = useATFNetWorthQuery();

  const balances = useMemo(() => {
    return isSuccess
      ? data.reduce(
          (result, item) => {
            return {
              jetton: result.jetton.plus(item.jetton),
              ton: result.ton.plus(item.ton),
            };
          },
          {
            jetton: new Decimal(0),
            ton: new Decimal(0),
          },
        )
      : null;
  }, [isSuccess, data]);

  return (
    <div
      className={cn(
        "p-2 rounded-2xl relative",
        "bg-purple-600 text-white",
        "flex flex-col items-center justify-center gap-2",
      )}
    >
      <h3 className="text-purple-100">Net Worth</h3>

      {/* Jetton balance */}
      <div className="flex items-center gap-2">
        <img src={ATFIcon} className="size-5 rounded-full" />
        <span className="text-2xl">
          {balances ? balances.jetton.toFixed(2) : "-.--"}
        </span>
        <span className="text-purple-100">ATF</span>
      </div>

      {/* TON Balance */}
      <div className="flex items-center gap-2">
        <img src={TonIcon} className="size-4" />
        <span>{balances ? balances.ton.toFixed(4) : "-.----"}</span>
        <span className="text-purple-100">TON</span>
      </div>
    </div>
  );
}
