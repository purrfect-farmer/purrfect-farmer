import useAppContext from "@/hooks/useAppContext";
import { BsStopCircle } from "react-icons/bs";
import { Dialog } from "radix-ui";
import {
  HiCheckBadge,
  HiOutlineCheckBadge,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { LiaUser } from "react-icons/lia";
import { PiUserCirclePlusBold } from "react-icons/pi";
import { Reorder, useDragControls } from "motion/react";
import { cn } from "@/utils";
import { memo } from "react";
import { useMemo } from "react";
import { useState } from "react";

import BottomDialog from "./BottomDialog";
import Container from "./Container";
import Input from "./Input";

const PickerButton = (props) => (
  <button
    {...props}
    className={cn(
      "text-neutral-500 dark:text-neutral-400",
      "bg-neutral-100 dark:bg-neutral-700",
      "hover:bg-orange-100 hover:text-orange-700",
      "dark:hover:bg-orange-200 dark:hover:text-orange-500",
      "flex items-center justify-center",
      "px-3 rounded-xl shrink-0 touch-none",
      props.className
    )}
  />
);

const AccountSelector = memo(
  ({
    account,
    launchAccount,
    closeAccount,
    showStop = true,
    showReorder = true,
  }) => {
    const dragControls = useDragControls();
    const { user } = account;
    const userFullName = useMemo(
      () =>
        user
          ? [user["first_name"], user["last_name"]].filter(Boolean).join(" ")
          : "",
      [user]
    );

    return (
      <Reorder.Item
        value={account.persisted}
        dragListener={false}
        dragControls={dragControls}
      >
        <div className="flex gap-2">
          <Dialog.Close
            onClick={() => launchAccount(account.id)}
            className={cn(
              "px-2 py-1 rounded-xl text-left",
              "bg-neutral-100 dark:bg-neutral-700",
              "hover:bg-orange-100 hover:text-orange-700",
              "dark:hover:bg-orange-200 dark:hover:text-orange-500",
              "grow min-w-0 min-h-0 flex items-center gap-2",
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
              <HiCheckBadge className="shrink-0 text-orange-500 size-4" />
            ) : account.running ? (
              <HiOutlineCheckBadge className="shrink-0 text-orange-500 size-4" />
            ) : null}
          </Dialog.Close>

          {account.running && showStop ? (
            <PickerButton onClick={() => closeAccount(account.id)}>
              <BsStopCircle className="size-4" />
            </PickerButton>
          ) : null}

          {showReorder ? (
            <PickerButton onPointerDown={(event) => dragControls.start(event)}>
              <HiOutlineSquares2X2 className="size-4" />
            </PickerButton>
          ) : null}
        </div>
      </Reorder.Item>
    );
  }
);

export default memo(function AccountPicker() {
  const {
    accounts,
    addAccount,
    launchAccount,
    closeAccount,
    persistedAccounts,
    storePersistedAccounts,
  } = useAppContext();
  const [search, setSearch] = useState("");
  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;

    const lowerSearch = search.toLowerCase();
    return accounts.filter(
      (account) =>
        account.title.toLowerCase().includes(lowerSearch) ||
        (account.user &&
          (account.user["username"]?.toLowerCase().includes(lowerSearch) ||
            account.user["id"].toString().includes(lowerSearch))) ||
        [account.user["first_name"], account.user["last_name"]]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(lowerSearch)
    );
  }, [accounts, search]);

  return (
    <BottomDialog.Container onOpenAutoFocus={(ev) => ev.preventDefault()}>
      <Container className="flex flex-col p-4 gap-4 shrink-0">
        <div className="flex flex-col text-center">
          <Dialog.Title className="text-xl font-bold font-turret-road text-blue-400">
            Accounts
          </Dialog.Title>
          <Dialog.Description className="text-neutral-400 font-bold">
            Switch Active Account
          </Dialog.Description>
        </div>

        {/* Search Input */}
        <Input
          type="search"
          placeholder="Search Accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full shrink-0"
        />
      </Container>
      <div className="flex flex-col min-w-0 min-h-0 gap-2 overflow-auto grow">
        <Container className="p-0 px-4">
          {/* Set Active Account */}
          <Reorder.Group
            values={persistedAccounts}
            onReorder={storePersistedAccounts}
            className="flex flex-col gap-2"
          >
            {filteredAccounts.map((account) => (
              <AccountSelector
                key={account.id}
                account={account}
                launchAccount={launchAccount}
                closeAccount={closeAccount}
                showStop={persistedAccounts.length > 1}
                showReorder={persistedAccounts.length > 1 && !search.trim()}
              />
            ))}
          </Reorder.Group>
        </Container>
      </div>

      {/* Add Account / Close Dialog */}
      <Container className="flex flex-col gap-2 p-4 shrink-0">
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
      </Container>
    </BottomDialog.Container>
  );
});
