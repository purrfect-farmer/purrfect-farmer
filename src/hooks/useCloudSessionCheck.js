import { useEffect } from "react";

import useAppContext from "./useAppContext";
import useCloudTelegramSessionQuery from "./useCloudTelegramSessionQuery";

export default function useCloudSessionCheck(context) {
  const app = useAppContext();
  const { setCloudTelegramSession } = context || app;
  const { data, isSuccess } = useCloudTelegramSessionQuery(context);

  useEffect(() => {
    if (isSuccess) {
      setCloudTelegramSession(data.session);
    }
  }, [isSuccess, data]);
}
