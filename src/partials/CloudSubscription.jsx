import Alert from "@/components/Alert";
import useAppContext from "@/hooks/useAppContext";
import useCloudSubscriptionQuery from "@/hooks/useCloudSubscriptionQuery";
import { differenceInHours, formatDate } from "date-fns";

export default function CloudSubscription() {
  const { telegramUser, settings } = useAppContext();
  const initData = telegramUser?.initData;
  const enabled = settings.enableCloud && Boolean(initData);

  const { status, data } = useCloudSubscriptionQuery();
  const subscription = data?.subscription;

  return enabled ? (
    <div className="px-2">
      <Alert
        variant={
          status === "pending"
            ? "info"
            : status === "error"
            ? "danger"
            : subscription &&
              differenceInHours(new Date(subscription["ends_at"]), new Date()) >
                168
            ? "success"
            : "warning"
        }
      >
        {status === "pending" ? (
          "Checking Subscription..."
        ) : status === "error" ? (
          "Failed to Check Cloud Subscription!"
        ) : subscription ? (
          <>
            Cloud Subscription is active.{" "}
            <b>
              (Expires:{" "}
              {formatDate(
                new Date(subscription["ends_at"]),
                "EEEE - do MMM, yyyy"
              )}
              )
            </b>
          </>
        ) : (
          "No Cloud Subscription"
        )}
      </Alert>
    </div>
  ) : null;
}
