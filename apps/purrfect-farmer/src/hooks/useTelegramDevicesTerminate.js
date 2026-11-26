import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import useAppContext from "./useAppContext";
import { TELEGRAM_DEVICES_QUERY_KEY } from "./useTelegramDevicesQuery";

/** Telegram's error for a session too new to terminate others */
const FRESH_RESET_ERROR = "FRESH_RESET_AUTHORISATION_FORBIDDEN";

/** The mutation key of a one-device termination */
export const TELEGRAM_DEVICE_TERMINATE_KEY = [
  "telegram",
  "devices",
  "terminate",
];

/** A readable message for a failed termination */
const getErrorMessage = (error) =>
  error?.errorMessage === FRESH_RESET_ERROR
    ? "Telegram only allows this once this session is 24 hours old"
    : error?.message || "Unknown error";

/** A hook for terminating one device or every other device */
export default function useTelegramDevicesTerminate() {
  const { telegramClient } = useAppContext();
  const queryClient = useQueryClient();
  const ref = telegramClient.ref;

  /** Remove devices from the loaded list */
  const keepDevices = (predicate) =>
    queryClient.setQueryData(TELEGRAM_DEVICES_QUERY_KEY, (devices) =>
      devices?.filter(predicate),
    );

  /** The mutation terminating one device */
  const terminateOne = useMutation({
    mutationKey: TELEGRAM_DEVICE_TERMINATE_KEY,
    mutationFn: (hash) =>
      toast.promise(ref.current.terminateAuthorization(hash), {
        loading: "Terminating device...",
        success: "Device terminated!",
        error: (error) => `Failed to terminate: ${getErrorMessage(error)}`,
      }),
    onSuccess: (_data, hash) =>
      keepDevices((device) => device.hash.toString() !== hash.toString()),
  });

  /** The mutation terminating every other device */
  const terminateOthers = useMutation({
    mutationKey: ["telegram", "devices", "terminate-others"],
    mutationFn: () =>
      toast.promise(ref.current.terminateOtherAuthorizations(), {
        loading: "Terminating other devices...",
        success: "Other devices terminated!",
        error: (error) => `Failed to terminate: ${getErrorMessage(error)}`,
      }),
    onSuccess: () => keepDevices((device) => device.current),
  });

  return { terminateOne, terminateOthers };
}
