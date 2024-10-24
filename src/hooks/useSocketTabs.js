import { useMemo } from "react";

import useSocketState from "./useSocketState";

export default function useSocketTabs(key = "", defaultValue) {
  /** Tab Value */
  const [value, setValue, dispatchAndSetValue] = useSocketState(
    key,
    defaultValue
  );

  return useMemo(
    () => ({ value, onValueChange: dispatchAndSetValue }),
    [value, dispatchAndSetValue]
  );
}
