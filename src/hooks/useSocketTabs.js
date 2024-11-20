import { useMemo } from "react";

import useSocketState from "./useSocketState";
import useValuesMemo from "./useValuesMemo";

export default function useSocketTabs(
  key = "",
  defaultList = [],
  defaultValue
) {
  /** List */
  const list = useMemo(() => defaultList, [...defaultList]);

  /** Tab Value */
  const [value, setValue, dispatchAndSetValue] = useSocketState(
    key,
    defaultValue || list[0]
  );

  return useValuesMemo({
    value,
    list,
    setValue,
    dispatchAndSetValue,
    rootProps: useValuesMemo({ value, onValueChange: dispatchAndSetValue }),
  });
}
