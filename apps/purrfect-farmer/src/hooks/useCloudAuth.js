import useStorageState from "./useStorageState";
import useValuesMemo from "./useValuesMemo";

export default function useCloudAuth() {
  const {
    value: token,
    storeValue: storeToken,
    removeValue: removeToken,
  } = useStorageState("cloud-auth-token", null);

  return useValuesMemo({
    token,
    storeToken,
    removeToken,
  });
}
