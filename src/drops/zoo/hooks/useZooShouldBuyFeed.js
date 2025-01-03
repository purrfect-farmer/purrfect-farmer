import { isAfter } from "date-fns";
import { useMemo } from "react";

import useZooDataQueries from "./useZooDataQueries";

export default function useZooShouldBuyFeed() {
  const dataQueries = useZooDataQueries();

  const [allData] = dataQueries.data;

  const hero = allData?.hero;
  const balance = hero?.coins || 0;
  const tph = hero?.tph || 0;

  const instantItemPriceInTph =
    allData?.dbData?.dbAutoFeed?.find((item) => item.key === "instant")
      ?.priceInTph || 0;

  const feedPrice = Math.ceil(tph * instantItemPriceInTph);

  const feed = allData?.feed;
  const isNeedFeed = feed?.isNeedFeed;
  const nextFeedTime = feed?.nextFeedTime;

  const hasExpired = useMemo(
    () => nextFeedTime && isAfter(new Date(), new Date(nextFeedTime + "Z")),
    [nextFeedTime]
  );

  const shouldPurchaseFeed = isNeedFeed || hasExpired;
  const canPurchaseFeed = balance >= feedPrice;

  return shouldPurchaseFeed && canPurchaseFeed;
}
