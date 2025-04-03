import SessionMessenger from "@/lib/SessionMessenger";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useTabContext from "./useTabContext";
import useValuesMemo from "./useValuesMemo";

export default function useSessionFarmer() {
  const { telegramClient } = useAppContext();
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
    messenger.startBot().then((event) => {
      if (typeof handleStartReply !== "undefined") {
        handleStartReply(messenger, event).then(() => {
          setStarted(true);
        });
      } else {
        setStarted(true);
      }
    });
  }, [
    /** Deps */
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
