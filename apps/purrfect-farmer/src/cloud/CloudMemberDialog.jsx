import Alert from "@/components/Alert";
import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import toast from "react-hot-toast";
import useCloudManagerKickMemberMutation from "@/hooks/useCloudManagerKickMemberMutation";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HiOutlineArrowUpRight } from "react-icons/hi2";
import useAppContext from "@/hooks/useAppContext";

export default function CloudMemberDialog({ account, farmer }) {
  const { launchInAppBrowser } = useAppContext();
  const queryClient = useQueryClient();
  const kickMemberMutation = useCloudManagerKickMemberMutation();
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
            src={account.user?.["photo_url"] || UserIcon}
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
                "title" in account ? "inline-flex" : "hidden"
              )}
            >
              {account.title || "TGUser"}
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="px-2 font-bold text-base text-center text-orange-500">
              @{account.user?.["username"] || account.id}
            </Dialog.Description>

            {/* User ID */}
            <p className="px-2 font-bold text-purple-500 text-center">
              User ID: <span>{account.id}</span>
            </p>
          </div>

          {/* Show Subscription */}
          {"subscriptions" in account ? (
            <Alert
              variant={account.subscriptions.length ? "success" : "warning"}
              className="mt-1"
            >
              {account.subscriptions.length ? (
                <>
                  Subscription is active. <br />
                  <b>
                    (Expires:{" "}
                    {formatDate(
                      new Date(account.subscriptions[0].endsAt),
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
                      farmer.active ? "text-green-500" : "text-red-500"
                    }
                  >
                    {farmer.active ? "Connected" : "Disconnected"}
                  </p>
                </div>

                {/* Open in App Browser Button */}
                {farmer.initData && farmer.FarmerClass ? (
                  <Dialog.Close
                    onClick={() =>
                      launchInAppBrowser({
                        id: `${account.id}-farmer-${farmer.id}`,
                        icon: farmer.icon,
                        title: `${account.title || "TGUser"}'s ${farmer.title}`,
                        url: farmer.FarmerClass.getUrlFromInitData(
                          farmer.initData
                        ),
                      })
                    }
                    className={cn(
                      "shrink-0 flex items-center gap-2",
                      "text-blue-500 hover:underline"
                    )}
                  >
                    {" "}
                    <HiOutlineArrowUpRight className="size-4" />
                    Open
                  </Dialog.Close>
                ) : null}
              </div>
            </>
          ) : null}

          {/* Session */}
          <Alert variant={account.session ? "success" : "warning"}>
            {account.session
              ? "Telegram Session is active."
              : "No Cloud Telegram Session."}
          </Alert>
        </div>

        <div className="flex flex-col gap-2 p-4">
          {/* Kick Button */}
          <button
            title="Kick User"
            disabled={kickMemberMutation.isPending}
            onClick={() => kickMember(account.id)}
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
