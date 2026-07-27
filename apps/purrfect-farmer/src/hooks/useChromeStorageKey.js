import { accountStorageKey, sharedStorageKey } from "@/lib/storageKeys";

import useAccountContext from "./useAccountContext";

export default function useChromeStorageKey(key, shared = false) {
  const account = useAccountContext();

  return shared ? sharedStorageKey(key) : accountStorageKey(account.id, key);
}
