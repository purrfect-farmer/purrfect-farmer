import useCore from "./useCore";
import useMiniAppToolbar from "./useMiniAppToolbar";
import useTelegramUser from "./useTelegramUser";
import useValuesMemo from "./useValuesMemo";
import useZoomies from "./useZoomies";

export default function useApp() {
  const core = useCore();
  const zoomies = useZoomies(core);
  const telegramUser = useTelegramUser(core);

  /** Use Toolbar */
  useMiniAppToolbar(core);

  return useValuesMemo({
    ...core,
    zoomies,
    telegramUser,
  });
}
