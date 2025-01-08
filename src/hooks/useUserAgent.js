import useStorageState from "./useStorageState";

export default function useUserAgent() {
  return useStorageState("userAgent").value;
}
