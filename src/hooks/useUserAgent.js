import useStorageState from "./useStorageState";

export default function useUserAgent() {
  useStorageState("userAgent").value;
}
