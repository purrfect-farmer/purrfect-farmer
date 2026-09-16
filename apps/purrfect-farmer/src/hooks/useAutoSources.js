import autos, { autoStateKeys } from "@/core/autos";

import { sharedStorageKey } from "@/lib/storageKeys";
import storage from "@/lib/storage";
import useAuto from "./useAuto";
import { useMemo } from "react";

/** The other Auto drops that hold wallets, read straight out of storage and snapshotted per mount */
export default function useAutoSources() {
  const { config } = useAuto();

  return useMemo(
    () =>
      autos
        .filter((item) => item.id !== config.id)
        .map((item) => {
          const keys = autoStateKeys(item);

          return {
            config: item,
            master: storage.get(sharedStorageKey(keys.master)) || null,
            accounts: storage.get(sharedStorageKey(keys.accounts)) || [],
          };
        })
        .filter((source) => Boolean(source.master)),
    [config.id],
  );
}
