import useSocketState from "./useSocketState";
import useValuesMemo from "./useValuesMemo";

export default function useSocketTabs(key = "", defaultValue) {
  /** Tab Value */
  const [value, setValue, dispatchAndSetValue] = useSocketState(
    key,
    defaultValue
  );

  return useValuesMemo({
    value,
    setValue,
    dispatchAndSetValue,
    root: useValuesMemo({ value, onValueChange: dispatchAndSetValue }),
  });
}
