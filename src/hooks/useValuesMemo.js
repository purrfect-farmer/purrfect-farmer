import { useMemo } from "react";

export default function useValuesMemo(data) {
  return useMemo(() => data, Object.values(data));
}
