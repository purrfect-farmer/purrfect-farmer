import { isAfter } from "date-fns";
import { useMemo } from "react";

import useZooDataQueries from "./useZooDataQueries";

export default function useZooShouldBuyFeed() {
  const dataQueries = useZooDataQueries();

  const [allData] = dataQueries.data;

  const feed = allData?.feed;
  const isNeedFeed = feed?.isNeedFeed;
  const nextFeedTime = feed?.nextFeedTime;

  const hasExpired = useMemo(
    () => nextFeedTime && isAfter(new Date(), new Date(nextFeedTime + "Z")),
    [nextFeedTime]
  );
  const shouldPurchase = isNeedFeed || hasExpired;

  return shouldPurchase;
}
