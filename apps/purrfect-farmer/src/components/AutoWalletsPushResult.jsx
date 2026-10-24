import Alert from "./Alert";
import { getCloudErrorMessage } from "@/lib/autoCloudWallets";
import { memo } from "react";

/** Outcome of a wallet push, or the server's reason when it failed */
export default memo(function AutoWalletsPushResult({ data, error }) {
  if (error) {
    return <Alert variant="danger">{getCloudErrorMessage(error)}</Alert>;
  }

  if (!data) return null;

  return (
    <Alert variant="success">
      Stored on the server: {data.created} new, {data.updated} updated.
    </Alert>
  );
});
