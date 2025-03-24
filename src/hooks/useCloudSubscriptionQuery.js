import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudSubscriptionQuery(context) {
  const app = useAppContext();
  const { telegramUser, settings, cloudBackend } = context || app;
  const initData = telegramUser?.["init_data"];
  const enabled = settings.enableCloud && Boolean(initData);

  return useQuery({
    enabled,
    retry: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryKey: ["app", "cloud", "subscription", enabled, settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .post(
          "/api/subscription",
          {
            auth: initData,
          },
          { signal }
        )
        .then((res) => res.data),
  });
}
