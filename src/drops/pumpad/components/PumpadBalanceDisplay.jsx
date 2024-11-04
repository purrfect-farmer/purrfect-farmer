import { useMemo } from "react";
import StarIcon from "../assets/images/star.png?format=webp";
import usePumpadAssetsQuery from "../hooks/usePumpadAssetsQuery";

export default function PumpadBalanceDisplay() {
  const query = usePumpadAssetsQuery();
  const assets = useMemo(() => query.data?.assets || [], [query.data]);
  const star = useMemo(
    () => assets?.find((item) => item.type === "STAR"),
    [assets]
  );
  const otherAssets = useMemo(
    () =>
      assets
        ?.filter((item) => item.type !== "STAR")
        .map((item) => ({
          ...item,
          amount: item["amount"] / Math.pow(10, item["token"]["decimals"]),
        })),
    [assets]
  );

  return (
    <div className="flex flex-col gap-2 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          {/* Star */}
          <h3 className="flex items-center justify-center gap-2 text-xl font-bold">
            <img src={StarIcon} className="h-4" />
            {Intl.NumberFormat().format(star.amount)}
          </h3>

          {/* Other Assets */}
          <div className="flex flex-wrap justify-center gap-2 px-4">
            {otherAssets.map((item) => (
              <div
                key={item["type"]}
                className="flex items-center gap-1 p-1 rounded-full bg-neutral-100"
              >
                <img src={item["token"]["image_url"]} className="w-5 h-5" />
                <span className="mr-1 text-xs font-bold">{item["amount"]}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
}
