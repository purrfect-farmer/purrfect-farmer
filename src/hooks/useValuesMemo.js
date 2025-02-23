import { useDeepCompareMemo } from "use-deep-compare";

export default function useValuesMemo(data) {
  return useDeepCompareMemo(() => data, [data]);
}
