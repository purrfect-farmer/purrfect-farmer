import SessionMessenger from "@/lib/SessionMessenger";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useTabContext from "./useTabContext";
import useValuesMemo from "./useValuesMemo";
import { FARMER_MODE } from "@/constants/farmerMode";

export default function useSessionFarmer() {
  const { farmerMode, telegramClient } = useAppContext();
  const {
    id,
    title,
    icon,
    mode,
    handleStartReply,
    syncToCloud = false,
    entity,
    startParam,
  } = useTabContext();

  const [started, setStarted] = useState(false);
  const messenger = useMemo(
    () =>
      new SessionMessenger({
        client: telegramClient.ref.current,
        entity,
        startParam,
      }),
    [entity, startParam]
  );

  /** QueryClient */
  const queryClient = useQueryClient();

  /** Remove Queries */
  const removeQueries = useCallback(() => {
    queryClient.removeQueries({ queryKey: [id] });
  }, [id, queryClient.removeQueries]);

  /** Start Bot */
  useEffect(() => {
    if (farmerMode === FARMER_MODE.SESSION) {
      messenger.startBot().then((message) => {
        if (typeof handleStartReply !== "undefined") {
          handleStartReply(messenger, message).then(() => {
            setStarted(true);
          });
        } else {
          setStarted(true);
        }
      });
    }
  }, [
    /** Deps */
    farmerMode,
    messenger,
    handleStartReply,
    setStarted,
  ]);

  /** Clean Up */
  useEffect(() => () => removeQueries(), [removeQueries]);

  return useValuesMemo({
    id,
    title,
    icon,
    mode,
    entity,
    startParam,
    started,
    messenger,
  });
}
