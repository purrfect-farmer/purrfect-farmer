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
  const cloudSyncMutation = useCloudSyncMutation(id, queryClient);

  /** Sync to Cloud */
  useLayoutEffect(() => {
    if (shouldSyncToCloud) {
      cloudSyncMutation
        .mutateAsync({
          title: account.title,
          farmer: id,
          userId: instance.telegramWebApp.initDataUnsafe.user.id,
          initData: instance.telegramWebApp.initData,
          headers: Object.fromEntries(
            Object.entries(instance.api.defaults.headers.common).filter(
              ([k]) => !["x-whisker-origin"].includes(k)
            )
          ),
        })
        .then(() => {
          toast.success(`${title} - Synced to Cloud`);
        });
    }
  }, [id, title, account, instance, shouldSyncToCloud]);
}
