import useAppContext from "@/hooks/useAppContext";
import { Dialog } from "radix-ui";
import { LiaUser } from "react-icons/lia";
import { PiUserCirclePlusBold } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { useMemo } from "react";
import { HiOutlineCheckBadge } from "react-icons/hi2";

const AccountSelector = memo(({ account, launchAccount }) => {
  const { user } = account;
  const userFullName = useMemo(
    () =>
      user
        ? [user["first_name"], user["last_name"]].filter(Boolean).join(" ")
        : "",
    [user]
  );

  return (
    <Dialog.Close
      onClick={() => launchAccount(account.id)}
      className={cn(
        "px-2 py-1 rounded-xl text-left",
        "bg-neutral-100 dark:bg-neutral-700",
        "hover:bg-orange-100 hover:text-orange-700",
        "dark:hover:bg-orange-200 dark:hover:text-orange-500",
        "min-w-0 min-h-0 flex items-center gap-2",
        "group"
      )}
    >
      {/* User  */}
      {user?.["photo_url"] ? (
        <img
          src={user?.["photo_url"]}
          className="size-8 shrink-0 rounded-full"
        />
      ) : (
        <div className="p-1 shrink-0">
          <LiaUser className="size-5" />
        </div>
      )}

      <div className="flex flex-col grow min-w-0">
        {/* Title */}
        <h1 className="font-bold truncate w-full">
          {account.title}{" "}
          {userFullName ? (
            <span
              className={cn(
                "text-neutral-500 dark:text-neutral-400",
                "group-hover:text-orange-900"
              )}
            >
              ({userFullName})
            </span>
          ) : null}
        </h1>
        {/* Username */}
        {user?.["username"] ? (
          <h5
            className={cn(
              "truncate",
              "text-neutral-500 dark:text-neutral-400",
              "group-hover:text-orange-900"
            )}
          >
            @{user["username"]}
          </h5>
        ) : null}
      </div>

      {account.active ? (
        <HiOutlineCheckBadge className="shrink-0 text-orange-500 size-4" />
      ) : null}
    </Dialog.Close>
  );
});

export default memo(function AccountPicker() {
  const { accounts, addAccount, launchAccount } = useAppContext();

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        className={cn(
          "bg-white dark:bg-neutral-800",
          "fixed z-50 inset-x-0 bottom-0 flex flex-col h-3/4 rounded-t-xl",
          "flex flex-col"
        )}
        onOpenAutoFocus={(ev) => ev.preventDefault()}
      >
        <div className="flex flex-col min-w-0 min-h-0 gap-2 overflow-auto grow p-4">
          <div className="flex flex-col">
            <Dialog.Title className="text-lg font-bold text-center">
              <span
                className={cn(
                  "text-transparent font-bold",
                  "bg-clip-text",
                  "bg-linear-to-r from-pink-500 to-violet-500"
                )}
              >
                Accounts
              </span>
            </Dialog.Title>
            <Dialog.Description className="text-center">
              <span
                className={cn(
                  "text-transparent font-bold",
                  "bg-clip-text",
                  "bg-linear-to-r from-green-500 to-blue-500"
                )}
              >
                Switch Active Account
              </span>
            </Dialog.Description>
          </div>

          {/* Set Active Account */}
          {accounts.map((account) => (
            <AccountSelector
              key={account.id}
              account={account}
              launchAccount={launchAccount}
            />
          ))}
        </div>

        {/* Add Account / Close Dialog */}
        <div className="flex flex-col gap-2 p-4">
          {/* Add Account */}
          {!import.meta.env.VITE_WHISKER ? (
            <Dialog.Close
              onClick={() => addAccount()}
              className={cn(
                "bg-purple-100 ",
                "text-purple-900",
                "p-2.5 rounded-xl shrink-0 font-bold",
                "flex items-center justify-center gap-2"
              )}
            >
              <PiUserCirclePlusBold className="size-4" />
              Add Account
            </Dialog.Close>
          ) : null}

          {/* Close Dialog */}
          <Dialog.Close
            className={cn(
              "bg-blue-100 dark:bg-blue-700",
              "text-blue-900 dark:text-blue-100",
              "p-2.5 rounded-xl shrink-0 font-bold",
              "flex items-center justify-center gap-2"
            )}
          >
            Close
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
});
