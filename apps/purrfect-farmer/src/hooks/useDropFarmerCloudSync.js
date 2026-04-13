import { customLogger } from "@/utils";
import toast from "react-hot-toast";
import { useCallback } from "react";
import useCloudSyncMutation from "./useCloudSyncMutation";
import { useLayoutEffect } from "react";
import useSyncedRef from "./useSyncedRef";

export default function useDropFarmerCloudSync({
  id,
  title,
  account,
  instance,
  queryClient,
  shouldSyncToCloud,
}) {
  /** Cloud Sync Mutation */
  const { isPending, mutateAsync } = useCloudSyncMutation(id, queryClient);
  const syncingRef = useSyncedRef(isPending);

  const accountTitle = account.title;
  const accountUserId = account.user?.id;
  const accountTelegramInitData = account.telegramInitData;

  const syncToCloud = useCallback(async () => {
    const cookies = await instance.getCookiesForSync?.();
    const data = {
      farmer: id,
      title: accountTitle,
      userId: instance.getUserId() || accountUserId,
      initData: instance.getInitData() || accountTelegramInitData,
      headers: instance.api.defaults.headers.common,
      cookies: cookies || [],
    };
    customLogger("SYNCING FARMER TO CLOUD", data);
    mutateAsync(data).then(() => {
      toast.success(`${title} - Synced to Cloud`);
    });
  }, [
    id,
    title,
    accountTitle,
    accountUserId,
    accountTelegramInitData,
    instance,
    mutateAsync,
  ]);

  /** Sync to Cloud */
  useLayoutEffect(() => {
    if (syncingRef.current) return;
    if (shouldSyncToCloud) {
      syncToCloud();
    }
  }, [shouldSyncToCloud, syncToCloud]);
}
