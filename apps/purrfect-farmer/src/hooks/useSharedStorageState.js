import useStorageState from "./useStorageState";

export default function useSharedStorageState(key, defaultValue) {
  return useStorageState(key, defaultValue, true);
}
