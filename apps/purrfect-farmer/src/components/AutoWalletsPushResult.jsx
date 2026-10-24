import Alert from "./Alert";
import { getCloudErrorMessage } from "@/lib/autoCloudWallets";
import { memo } from "react";

/** A wallet push the server accepted, or its reason for refusing it */
export default memo(function AutoWalletsPushResult({ data, error }) {
  if (error) {
    return <Alert variant="danger">{getCloudErrorMessage(error)}</Alert>;
  }

  if (!data) return null;

  return (
    <Alert variant="success">
      Push started for {data.total} wallet{data.total === 1 ? "" : "s"}.
      Progress is sent to Telegram.
    </Alert>
  );
});
