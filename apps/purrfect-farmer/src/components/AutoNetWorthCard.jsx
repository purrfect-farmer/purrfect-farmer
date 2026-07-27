import Decimal from "decimal.js";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { cn } from "@/utils";
import useAuto from "@/hooks/useAuto";
import useAutoNetWorthQuery from "@/hooks/useAutoNetWorthQuery";
import { useMemo } from "react";

export function AutoNetWorthCard() {
  const { config } = useAuto();
  const { isSuccess, data } = useAutoNetWorthQuery();

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

  const accountsWithBalanceCount = useMemo(() => {
    return isSuccess
      ? data.filter((item) => item.jetton.greaterThan(0)).length
      : 0;
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
        <img src={config.tokenIcon} className="size-5 rounded-full" />
        <span className="text-2xl">
          {balances ? balances.jetton.toFixed(2) : "-.--"}
        </span>
        <span className="text-purple-100">{config.token}</span>
      </div>

      {/* TON Balance */}
      <div className="flex items-center gap-2">
        <img src={TonIcon} className="size-4" />
        <span>{balances ? balances.ton.toFixed(4) : "-.----"}</span>
        <span className="text-purple-100">TON</span>
      </div>

      {/* Count of accounts with balance */}
      {accountsWithBalanceCount ? (
        <div className="text-center">
          Account(s) -
          <span className="font-bold">{accountsWithBalanceCount}</span>
        </div>
      ) : null}
    </div>
  );
}
