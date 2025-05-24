import useMirroredCallback from "@/hooks/useMirroredCallback";
import { useRegisterSW } from "virtual:pwa-register/react";

import PrimaryButton from "./PrimaryButton";

export default function PWAUpdate() {
  /** Service Worker */
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  /** Dispatch and Update Service Worker */
  const [, dispatchAndUpdateServiceWorker] = useMirroredCallback(
    "app.update-service-worker",
    () => {
      if (needRefresh) {
        updateServiceWorker(true);
      }
    },
    [needRefresh, updateServiceWorker]
  );

  return needRefresh ? (
    <PrimaryButton
      className="bg-orange-500 rounded-none"
      onClick={() => dispatchAndUpdateServiceWorker()}
    >
      Click to Update
    </PrimaryButton>
  ) : null;
}
