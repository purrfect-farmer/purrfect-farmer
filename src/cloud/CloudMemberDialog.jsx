import Alert from "@/components/Alert";
import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import toast from "react-hot-toast";
import useCloudKickMemberMutation from "@/hooks/useCloudKickMemberMutation";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CloudMemberDialog({ user, farmer }) {
  const queryClient = useQueryClient();
  const kickMemberMutation = useCloudKickMemberMutation();
  const kickMember = useCallback(
    (id) => {
      toast
        .promise(kickMemberMutation.mutateAsync(id), {
          success: "Successfully kicked",
          loading: "Kicking...",
          error: "Error...",
        })
        .finally(() =>
          queryClient.refetchQueries({ queryKey: ["app", "cloud"] })
        );
    },
    [kickMemberMutation.mutateAsync, queryClient.refetchQueries]
  );

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        className={cn(
          "bg-white dark:bg-neutral-800",
          "fixed z-50 inset-x-0 bottom-0 flex flex-col h-3/4 rounded-t-xl",
          "flex flex-col"
        )}
      >
        <div className="flex flex-col min-w-0 min-h-0 gap-2 p-4 overflow-auto grow">
          <img
            src={user["photo_url"] || UserIcon}
            className="w-24 h-24 rounded-full mx-auto"
          />

          <div className="flex flex-col">
            {/* Title */}
            <Dialog.Title
              className={cn(
                "items-center justify-center gap-2",
                "text-center",
                "text-xl truncate",
                "text-blue-500 font-bold",
                "title" in user ? "inline-flex" : "hidden"
              )}
            >
              {user["title"] || "TGUser"}
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="px-2 font-bold text-base text-center text-orange-500">
              @{user["username"]}
            </Dialog.Description>

            {/* User ID */}
            <p className="px-2 font-bold text-purple-500 text-center">
              User ID: <span>{user["user_id"]}</span>
            </p>
          </div>

          {/* Show Subscription */}
          {"subscription" in user ? (
            <Alert
              variant={user["subscription"] ? "success" : "warning"}
              className="mt-1"
            >
              {user["subscription"] ? (
                <>
                  Subscription is active. <br />
                  <b>
                    (Expires:{" "}
                    {formatDate(
                      new Date(user["subscription"]["ends_at"]),
                      "EEEE - do MMM, yyyy"
                    )}
                    )
                  </b>
                </>
              ) : (
                <>No Cloud Subscription</>
              )}
            </Alert>
          ) : null}

          {farmer ? (
            <>
              {/* Farmer */}
              <div
                className={cn(
                  "p-2 flex items-center gap-2 rounded-xl",
                  "bg-neutral-100 dark:bg-neutral-700"
                )}
              >
                <img
                  src={farmer.icon}
                  className="w-10 h-10 rounded-full shrink-0"
                />
                <div className="grow truncate min-w-0 min-h-0">
                  <h1 className="font-bold">{farmer.title}</h1>
                  <p
                    className={
                      user["is_connected"] ? "text-green-500" : "text-red-500"
                    }
                  >
                    {user["is_connected"] ? "Connected" : "Disconnected"}
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {/* Session */}
          <Alert variant={user["session_id"] ? "success" : "warning"}>
            {user["session_id"]
              ? "Telegram Session is active."
              : "No Cloud Telegram Session."}
          </Alert>
        </div>

        <div className="flex flex-col gap-2 p-4">
          {/* Kick Button */}
          <button
            title="Kick User"
            disabled={kickMemberMutation.isPending}
            onClick={() => kickMember(user["user_id"])}
            className={cn(
              "px-4 py-2 bg-red-500 text-white rounded-lg",
              "disabled:opacity-60"
            )}
          >
            Kick User
          </button>

          {/* Cancel Button */}
          <Dialog.Close
            disabled={kickMemberMutation.isPending}
            className={cn(
              "px-4 py-2 bg-neutral-200 dark:bg-neutral-900 rounded-lg",
              "disabled:opacity-60"
            )}
          >
            Cancel
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
