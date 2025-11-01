import { useMemo } from "react";

import useMirroredCallback from "./useMirroredCallback";
import useMirroredState from "./useMirroredState";
import useValuesMemo from "./useValuesMemo";

export default function useMirroredTabs(
  key = "",
  defaultList = [],
  defaultValue
) {
  /** List */
  const list = useMemo(() => defaultList, [...defaultList]);

  /** Tab Value */
  const [value, setValue, dispatchAndSetValue] = useMirroredState(
    key,
    defaultValue || list[0]
  );

  /** Reset Tab */
  const [reset, dispatchAndReset] = useMirroredCallback(
    key + ":reset",
    () => setValue(list[0]),
    [list, setValue]
  );

  return useValuesMemo({
    value,
    list,
    reset,
    setValue,
    dispatchAndReset,
    dispatchAndSetValue,
    rootProps: useValuesMemo({ value, onValueChange: dispatchAndSetValue }),
  });
}
