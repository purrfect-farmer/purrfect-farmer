import {
  FARMER_COMMAND,
  FARMER_COMMANDS,
  FARMER_COMMAND_RESULT,
  isCommandForFarmer,
  normalizeCommandResult,
  onMirrorAction,
} from "@/lib/farmerCommands";

import useFarmerCommandBus from "./useFarmerCommandBus";
import { useLayoutEffect } from "react";
import { useRef } from "react";
import useSharedContext from "./useSharedContext";
import useSyncedRef from "./useSyncedRef";

/** How many answered request ids to remember before starting over */
const HANDLED_LIMIT = 200;

/**
 * Receiving side of the addressed-command protocol.
 */
export default function useFarmerCommandListener({
  farmerId,
  userId,
  instance,
  logger,
}) {
  const { mirror } = useSharedContext();
  const { emit } = useFarmerCommandBus();
  const handled = useRef(new Set());
  const targetRef = useSyncedRef({ farmerId, userId, instance, logger });

  useLayoutEffect(
    () =>
      onMirrorAction(mirror.handler, FARMER_COMMAND, async (envelope) => {
        const command = envelope?.data;
        const target = targetRef.current;

        /** Is it meant for this farmer's Telegram user? */
        if (!isCommandForFarmer(command, target.farmerId, target.userId)) {
          return;
        }

        /** The same account open in two mirrored windows must not act twice */
        if (handled.current.has(command.requestId)) {
          return;
        }

        if (handled.current.size >= HANDLED_LIMIT) {
          handled.current.clear();
        }

        handled.current.add(command.requestId);

        const run = FARMER_COMMANDS[command.command];
        let result;

        if (!run) {
          result = {
            status: false,
            message: `Unknown command: ${command.command}`,
          };
        } else {
          target.logger.info(`> Remote command: ${command.command}`);

          try {
            result = normalizeCommandResult(
              await run(target.instance, command.payload),
            );
          } catch (error) {
            result = {
              status: false,
              message: error?.message || "Unknown error",
            };
          }
        }

        if (result.status) {
          target.logger.success(`> Completed remote ${command.command}`);
        } else {
          target.logger.error(
            `> Failed remote ${command.command}:`,
            result.message,
          );
        }

        emit(FARMER_COMMAND_RESULT, {
          ...result,
          requestId: command.requestId,
          farmerId: target.farmerId,
          userId: target.userId,
        });
      }),
    [mirror.handler, targetRef, emit],
  );
}
