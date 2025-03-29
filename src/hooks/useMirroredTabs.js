import { useMemo } from "react";

import useMirroredState from "./useMirroredState";
import useValuesMemo from "./useValuesMemo";

export default function useMirroredTabs(
  key = "",
  defaultList = [],
  defaultValue,
  mirror
) {
  /** List */
  const list = useMemo(() => defaultList, [...defaultList]);

  /** Tab Value */
  const [value, setValue, dispatchAndSetValue] = useMirroredState(
    key,
    defaultValue || list[0],
    mirror
  );

  return useValuesMemo({
    value,
    list,
    setValue,
    dispatchAndSetValue,
    rootProps: useValuesMemo({ value, onValueChange: dispatchAndSetValue }),
  });
}
