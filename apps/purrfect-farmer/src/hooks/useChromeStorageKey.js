import useAccountContext from "./useAccountContext";

export default function useChromeStorageKey(key, shared = false) {
  const account = useAccountContext();

  return shared ? `shared:${key}` : `account-${account.id}:${key}`;
}
