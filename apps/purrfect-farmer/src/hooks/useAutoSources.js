import autos, { autoStateKeys } from "@/core/autos";

import { sharedStorageKey } from "@/lib/storageKeys";
import storage from "@/lib/storage";
import useAuto from "./useAuto";
import { useMemo } from "react";

/**
 * The other Auto drops that hold wallets, as import sources.
 *
 * Read straight out of storage rather than through `useSharedStorageState`,
 * because these belong to drops whose `Auto` component isn't mounted. Safe to
 * read synchronously: `main.jsx` awaits `storage.setup()` before rendering.
 *
 * The list is snapshotted per mount — import dialogs unmount when closed, so
 * reopening one picks up anything that changed in the meantime.
 */
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
