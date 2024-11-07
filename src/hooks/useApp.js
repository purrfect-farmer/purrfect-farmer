import useCore from "./useCore";
import useValuesMemo from "./useValuesMemo";
import useZoomies from "./useZoomies";

export default function useApp() {
  const core = useCore();
  const zoomies = useZoomies(core);
  return useValuesMemo({
    ...core,
    zoomies,
  });
}
