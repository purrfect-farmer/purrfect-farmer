import Alert from "@/components/Alert";
import BottomDialog from "@/components/BottomDialog";
import Container from "@/components/Container";
import { Dialog } from "radix-ui";
import { HiOutlineArrowUpRight } from "react-icons/hi2";
import ProxyDetails from "@/components/ProxyDetails";
import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import { cn } from "@/utils";
import { formatDate } from "date-fns";
import tabs from "@/core/tabs";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { useCallback } from "react";
import useCloudManagerKickMemberMutation from "@/hooks/useCloudManagerKickMemberMutation";
import { useQueryClient } from "@tanstack/react-query";

/* Member Dialog Header Component */
const MemberDialogHeader = ({ account }) => (
  <>
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
          "text-blue-400 font-bold",
          "title" in account ? "inline-flex" : "hidden",
        )}
      >
        {account.title || "TGUser"}
      </Dialog.Title>

      {/* Description */}
      <Dialog.Description
        className={cn(
          "px-2 font-bold text-base",
          "text-center text-orange-500",
        )}
      >
        @{account.user?.["username"] || account.id}
      </Dialog.Description>

      {/* User ID */}
      <p className="px-2 font-bold text-purple-500 text-center">
        User ID: <span>{account.id}</span>
      </p>
    </div>
  </>
);

/* Member Dialog Subscription Component */
const MemberDialogSubscriptions = ({ account }) => (
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
            "EEEE - do MMM, yyyy",
          )}
          )
        </b>
      </>
    ) : (
      <>No Cloud Subscription</>
    )}
  </Alert>
);

/* Member Dialog Farmer Component */
const MemberDialogFarmer = ({ account, farmer }) => {
  const { launchInAppBrowser, pushTab } = useAppContext();

  const launchFarmer = () => {
    if (farmer.initData && farmer.FarmerClass) {
      const tab = tabs.find((item) => item.id === farmer.FarmerClass.id);

      pushTab({
        ...tab,
        title: `${account.title || "TGUser"}'s ${farmer.FarmerClass.title}`,
        initData: farmer.initData,
        id: `${account.id}-farmer-${farmer.FarmerClass.id}`,
        external: true,
      });
    }
  };

  return (
    <div
      className={cn(
        "p-2 flex items-center gap-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      {/* Farmer Icon */}
      <Dialog.Close asChild onClick={launchFarmer}>
        <img
          src={farmer.icon}
          className="w-10 h-10 rounded-full shrink-0 cursor-pointer"
        />
      </Dialog.Close>
      {/* Farmer Title & Status */}
      <Dialog.Close asChild onClick={launchFarmer}>
        <div className="grow truncate min-w-0 min-h-0 cursor-pointer">
          <h1 className="font-bold">{farmer.title}</h1>
          <p className={farmer.active ? "text-green-500" : "text-red-500"}>
            {farmer.active ? "Connected" : "Disconnected"}
          </p>
        </div>
      </Dialog.Close>

      {/* Open in App Browser Button */}
      {farmer.initData && farmer.FarmerClass ? (
        <Dialog.Close
          onClick={() =>
            launchInAppBrowser({
              id: `${account.id}-farmer-${farmer.id}`,
              icon: farmer.icon,
              title: `${account.title || "TGUser"}'s ${farmer.title}`,
              url: farmer.FarmerClass.getUrlFromInitData(farmer.initData),
            })
          }
          className={cn(
            "shrink-0 flex items-center gap-2",
            "text-blue-500 hover:underline",
          )}
        >
          {" "}
          <HiOutlineArrowUpRight className="size-4" />
          Open
        </Dialog.Close>
      ) : null}
    </div>
  );
};

/* Member Dialog Proxy Component */
const MemberDialogProxy = ({ account }) => {
  return <ProxyDetails defaultOpen proxy={account.proxy} />;
};

/* Cloud Member Dialog Component */
export default function CloudMemberDialog({ account, farmer }) {
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
          queryClient.refetchQueries({ queryKey: ["app", "cloud"] }),
        );
    },
    [kickMemberMutation.mutateAsync, queryClient.refetchQueries],
  );

  return (
    <BottomDialog.Container className="h-3/4">
      <div className="flex flex-col min-w-0 min-h-0 overflow-auto grow">
        <Container className="flex flex-col gap-2 p-4">
          <MemberDialogHeader account={account} />

          {/* Show Subscription */}
          {"subscriptions" in account ? (
            <MemberDialogSubscriptions account={account} />
          ) : null}

          {/* Session */}
          <Alert variant={account.session ? "success" : "warning"}>
            {account.session ? (
              <>
                Telegram Session is active (
                <span className="font-bold">{account.session}</span>).
              </>
            ) : (
              "No Cloud Telegram Session."
            )}
          </Alert>

          {/* Farmer */}
          {farmer ? (
            <MemberDialogFarmer account={account} farmer={farmer} />
          ) : null}

          {/* Proxy */}
          <MemberDialogProxy account={account} />
        </Container>
      </div>

      <Container className="flex flex-col gap-2 p-4">
        {/* Kick Button */}
        <button
          title="Kick User"
          disabled={kickMemberMutation.isPending}
          onClick={() => kickMember(account.id)}
          className={cn(
            "px-4 py-2 bg-red-500 text-white rounded-lg",
            "disabled:opacity-60",
          )}
        >
          Kick User
        </button>

        {/* Cancel Button */}
        <Dialog.Close
          disabled={kickMemberMutation.isPending}
          className={cn(
            "px-4 py-2 bg-neutral-200 dark:bg-neutral-900 rounded-lg",
            "disabled:opacity-60",
          )}
        >
          Cancel
        </Dialog.Close>
      </Container>
    </BottomDialog.Container>
  );
}
