import useAppContext from "./useAppContext";

export default function useCloudQueryOptions(appContext) {
  const app = useAppContext();
  const { telegramUser, settings, cloudBackend } = appContext || app;
  const auth = telegramUser?.initData;
  const enabled = settings.enableCloud && Boolean(auth);

  return {
    enabled,
    auth,
    cloudBackend,
    cloudServer: settings.cloudServer,
  };
}
