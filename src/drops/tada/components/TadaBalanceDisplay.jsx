import { useMemo } from "react";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function TadaBalanceDisplay() {
  const { passivePointRequest, activePointRequest } = useFarmerContext();
  const isLoaded = passivePointRequest.data && activePointRequest.data;
  const result = useMemo(
    () => [passivePointRequest.data, activePointRequest.data],
    [passivePointRequest.data, activePointRequest.data]
  );

  const balance = useMemo(() => {
    return result
      ? result.reduce((total, item) => total + (item?.amount || 0), 0)
      : 0;
  }, [result]);

  return (
    <div className="flex flex-col gap-2 py-2">
      {!isLoaded ? (
        <h4 className="text-center">Detecting Balance...</h4>
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
