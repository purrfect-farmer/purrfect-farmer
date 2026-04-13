import useRefCallback from "./useRefCallback";

export default function useMemoizedCallback(func) {
  return useRefCallback(func, [func]);
}
