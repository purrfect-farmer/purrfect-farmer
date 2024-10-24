import { useMemo } from "react";
import useTadaBalanceQueries from "../hooks/useTadaBalanceQueries";

export default function TadaBalanceDisplay() {
  const query = useTadaBalanceQueries();
  const result = query.data;

  const balance = useMemo(() => {
    return result
      ? result.reduce((total, item) => total + (item?.amount || 0), 0)
      : 0;
  }, [result]);

  return (
    <div className="flex flex-col gap-2 py-2">
      {query.isPending ? (
        <h4 className="text-center">Fetching Balance...</h4>
      ) : query.isError ? (
        <h4 className="text-center text-red-500">Failed to fetch Balance...</h4>
      ) : (
        <>
          <h3 className="text-2xl font-bold text-center">
            {Intl.NumberFormat().format(balance)}
          </h3>
        </>
      )}
    </div>
  );
}
