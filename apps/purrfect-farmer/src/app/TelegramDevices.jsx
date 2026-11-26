import { useMutationState } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import Container from "@/components/Container";
import TelegramDeviceItem from "@/components/TelegramDeviceItem";
import useAppContext from "@/hooks/useAppContext";
import useLocalTelegramSessionLogout from "@/hooks/useLocalTelegramSessionLogout";
import useTelegramDevicesQuery from "@/hooks/useTelegramDevicesQuery";
import useTelegramDevicesTerminate, {
  TELEGRAM_DEVICE_TERMINATE_KEY,
} from "@/hooks/useTelegramDevicesTerminate";
import { FARMER_MODE } from "@/constants/farmerMode";

/** Read the hash of a pending termination */
const selectPendingHash = (mutation) => mutation.state.variables?.toString();

/** A tool listing the local session's signed in devices, each one terminable */
export default function TelegramDevices() {
  const { farmerMode } = useAppContext();
  const query = useTelegramDevicesQuery();
  const { terminateOne, terminateOthers } = useTelegramDevicesTerminate();
  const logout = useLocalTelegramSessionLogout();
  const devices = query.data;

  /** The hashes being terminated */
  const pendingHashes = useMutationState({
    filters: { mutationKey: TELEGRAM_DEVICE_TERMINATE_KEY, status: "pending" },
    select: selectPendingHash,
  });
  const pendingSet = useMemo(() => new Set(pendingHashes), [pendingHashes]);

  /** Whether any device besides this one is signed in */
  const hasOthers = useMemo(
    () => Boolean(devices?.some((device) => !device.current)),
    [devices],
  );

  /** The handler for terminating one device, logging out for this one */
  const { mutate: terminate } = terminateOne;
  const handleTerminate = useCallback(
    (device) =>
      device.current
        ? logout()
        : terminate(device.hash, { onError: console.error }),
    [logout, terminate],
  );

  /** The handler for terminating every other device */
  const handleTerminateOthers = () =>
    terminateOthers.mutate(undefined, { onError: console.error });

  /** Only the local session can list devices */
  if (farmerMode !== FARMER_MODE.SESSION) {
    return (
      <Container>
        <Alert variant="info">
          Telegram Devices is only available in <strong>Session</strong> mode.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-2">
      {query.isPending ? (
        /* Loading */
        <p className="text-center">Loading devices...</p>
      ) : query.isError ? (
        /* Error and retry */
        <>
          <Alert variant="danger">
            Failed to load devices: {query.error.message}
          </Alert>
          <Button type="button" onClick={() => query.refetch()}>
            Retry
          </Button>
        </>
      ) : (
        <>
          {/* Total */}
          <h4 className="text-center">Total: {devices.length}</h4>

          {/* Terminate all other devices */}
          <Button
            type="button"
            variant="danger"
            disabled={!hasOthers || terminateOthers.isPending}
            onClick={handleTerminateOthers}
          >
            Terminate all other devices
          </Button>

          {/* Devices */}
          {devices.map((device) => (
            <TelegramDeviceItem
              key={device.hash.toString()}
              device={device}
              isTerminating={
                terminateOthers.isPending ||
                pendingSet.has(device.hash.toString())
              }
              onTerminate={handleTerminate}
            />
          ))}
        </>
      )}
    </Container>
  );
}
