import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

export default function useCloudAuth() {
  const {
    value: token,
    hasRestoredValue: hasRestoredToken,
    storeValue: storeToken,
    removeValue: removeToken,
  } = useStorageState("cloudAuthToken", null);

  return useValuesMemo({
    token,
    hasRestoredToken,
    storeToken,
    removeToken,
  });
}
