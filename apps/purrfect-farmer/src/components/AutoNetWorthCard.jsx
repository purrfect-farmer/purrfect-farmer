import Decimal from "decimal.js";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { LuCoins, LuPickaxe } from "react-icons/lu";
import { cn } from "@/utils";
import { formatFigure, sumSnapshots } from "@/lib/autoSnapshot";
import useAuto from "@/hooks/useAuto";
import useAutoCloudSnapshotsQuery from "@/hooks/useAutoCloudSnapshotsQuery";
import useAutoNetWorthQuery from "@/hooks/useAutoNetWorthQuery";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";
import { useMemo } from "react";

export function AutoNetWorthCard() {
  const { config, accounts } = useAuto();
  const { isSuccess, data } = useAutoNetWorthQuery();

  const { enabled: cloudEnabled } = useCloudQueryOptions();
  const { data: snapshots } = useAutoCloudSnapshotsQuery();

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

  /** Mined pool and wallet holding */
  const totals = useMemo(
    () => sumSnapshots(accounts, snapshots),
    [accounts, snapshots],
  );

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

      {/* Totals the drop reports, absent until the server has farmed something */}
      {cloudEnabled && totals.count > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-3 text-xs text-purple-100">
          <span
            title="Total holding"
            className="inline-flex items-center gap-1"
          >
            <LuPickaxe className="size-3" />
            {formatFigure(totals.holding)}
          </span>

          <span title="Total mined" className="inline-flex items-center gap-1">
            <LuCoins className="size-3" />
            {formatFigure(totals.mined)}
          </span>
        </div>
      ) : null}

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
