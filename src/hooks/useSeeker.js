import toast from "react-hot-toast";
import { customLogger } from "@/lib/utils";
import { useLayoutEffect } from "react";

import useSeekerServerQuery from "./useSeekerServerQuery";

export default function useSeeker(app) {
  const { settings, dispatchAndConfigureSettings } = app;
  const serverQuery = useSeekerServerQuery(app);
  const address = serverQuery.data?.address;

  /** Update Cloud Server */
  useLayoutEffect(() => {
    if (
      serverQuery.isSuccess &&
      settings.enableSeeker &&
      settings.cloudServer !== address
    ) {
      /** Log */
      customLogger("SEEKER CLOUD SERVER ", serverQuery.data);

      /** Update Cloud Server Address */
      dispatchAndConfigureSettings("cloudServer", address);

      /** Toast */
      toast.success("Cloud Server Updated!");
    }
  }, [
    serverQuery.isSuccess,
    settings.enableSeeker,
    settings.cloudServer,
    address,
    dispatchAndConfigureSettings,
  ]);
}
