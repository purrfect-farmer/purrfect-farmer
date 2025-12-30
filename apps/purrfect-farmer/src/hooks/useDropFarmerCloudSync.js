import toast from "react-hot-toast";
import { useLayoutEffect } from "react";

import useCloudSyncMutation from "./useCloudSyncMutation";

export default function useDropFarmerCloudSync({
  id,
  title,
  account,
  instance,
  queryClient,
  shouldSyncToCloud,
}) {
  /** Cloud Sync Mutation */
  const { mutateAsync } = useCloudSyncMutation(id, queryClient);

  /** Sync to Cloud */
  useLayoutEffect(() => {
    if (shouldSyncToCloud) {
      (async () => {
        const cookies = await instance.getCookiesForSync?.();

        mutateAsync({
          title: account.title,
          farmer: id,
          userId: instance.getUserId() || account.user?.id,
          initData: instance.getInitData() || account.telegramInitData,
          headers: instance.api.defaults.headers.common,
          cookies: cookies || [],
        }).then(() => {
          toast.success(`${title} - Synced to Cloud`);
        });
      })();
    }
  }, [id, title, account, instance, mutateAsync, shouldSyncToCloud]);
}
