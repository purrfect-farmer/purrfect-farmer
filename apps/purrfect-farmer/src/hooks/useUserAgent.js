import useSharedStorageState from "./useSharedStorageState";

/** The stored User-Agent, null until storage has one */
export default function useUserAgent() {
  return useSharedStorageState("user-agent", null).value;
}
