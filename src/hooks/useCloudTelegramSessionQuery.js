import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudTelegramSessionQuery(context) {
  const app = useAppContext();
  const { telegramUser, settings, cloudBackend } = context || app;
  const initData = telegramUser?.initData;
  const enabled = settings.enableCloud && Boolean(initData);

  return useQuery({
    enabled,
    retry: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryKey: [
      "app",
      "cloud",
      "telegram-session",
      enabled,
      settings.cloudServer,
    ],
    queryFn: ({ signal }) =>
      cloudBackend
        .post(
          "/api/telegram/session",
          {
            auth: initData,
          },
          { signal }
        )
        .then((res) => res.data),
  });
}
