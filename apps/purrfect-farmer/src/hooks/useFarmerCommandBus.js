import {
  DEFAULT_COMMAND_TIMEOUT,
  FARMER_COMMAND,
  FARMER_COMMAND_RESULT,
  onMirrorAction,
} from "@/lib/farmerCommands";

import useRefCallback from "./useRefCallback";
import useSharedContext from "./useSharedContext";
import { useMemo } from "react";
import { uuid } from "@/utils";

/**
 * Sending side of the addressed-command protocol (see `@/lib/farmerCommands`).
 */
export default function useFarmerCommandBus() {
  const { mirror } = useSharedContext();

  const emit = useRefCallback(
    (action, payload) => {
      const envelope = { action, data: payload };

      mirror.handler.emit(action, envelope);
      mirror.dispatch(envelope);
    },
    [mirror],
  );

  /**
   * Sends one command and waits for the farmer holding `userId` to answer.
   */
  const send = useRefCallback(
    ({
      farmerId,
      userId,
      command,
      payload,
      label,
      timeout = DEFAULT_COMMAND_TIMEOUT,
    }) =>
      new Promise((resolve, reject) => {
        const requestId = uuid();
        let timer = null;

        const off = onMirrorAction(
          mirror.handler,
          FARMER_COMMAND_RESULT,
          (envelope) => {
            if (envelope?.data?.requestId !== requestId) return;

            clearTimeout(timer);
            off();
            resolve(envelope.data);
          },
        );

        timer = setTimeout(() => {
          off();
          reject(
            new Error(
              `${label || command}: no response from ${userId}. Is that account's farmer tab open and running?`,
            ),
          );
        }, timeout);

        emit(FARMER_COMMAND, {
          requestId,
          farmerId,
          userId,
          command,
          payload,
        });
      }),
    [mirror, emit],
  );

  return useMemo(() => ({ emit, send }), [emit, send]);
}
