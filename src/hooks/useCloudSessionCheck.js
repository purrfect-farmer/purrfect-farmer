import { useEffect } from "react";

import useAppContext from "./useAppContext";
import useCloudSubscriptionQuery from "./useCloudSubscriptionQuery";

export default function useCloudSessionCheck(context) {
  const app = useAppContext();
  const { setCloudTelegramSession } = context || app;
  const { data, isSuccess } = useCloudSubscriptionQuery(context);

  useEffect(() => {
    if (isSuccess) {
      setCloudTelegramSession(data.account.session);
    }
  }, [isSuccess, data]);
}
