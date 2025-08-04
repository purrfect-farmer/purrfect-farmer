import useStorageState from "./useStorageState";

export default function useUserAgent() {
  return useStorageState("user-agent", true).value;
}
