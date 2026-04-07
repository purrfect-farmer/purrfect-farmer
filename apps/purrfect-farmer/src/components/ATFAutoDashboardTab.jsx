import {
  MdOutlineClose,
  MdOutlineContentCopy,
  MdOutlineSearch,
} from "react-icons/md";
import { cn, extractTgWebAppData } from "@/utils";
import { useMemo, useState } from "react";

import ATFAutoAccountItem from "./ATFAutoAccountItem";
import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoMasterEditDialog from "./ATFAutoMasterEditDialog";
import ATFAutoNewAccountDialog from "./ATFAutoNewAccountDialog";
import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import ATFIcon from "@/assets/images/atf.png?format=webp&w=32";
import { Dialog } from "radix-ui";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import Input from "./Input";
import PrimaryButton from "./PrimaryButton";
import { Reorder } from "motion/react";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFBalancesQuery from "@/hooks/useATFBalancesQuery";
import { useDebounce } from "react-use";

function MasterBalanceCard() {
  const { master } = useATFAuto();
  const { data: balances } = useATFBalancesQuery(master?.address);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div
      className={cn(
        "p-4 rounded-2xl relative",
        "bg-black text-white",
        "flex flex-col items-center justify-center gap-2",
      )}
    >
      {/* Edit Button */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Trigger asChild>
          <button
            className={cn(
              "absolute top-3 right-3",
              "p-1.5 rounded-lg",
              "bg-neutral-900 hover:bg-neutral-800",
              "cursor-pointer transition-colors",
            )}
          >
            <HiOutlinePencilSquare className="size-4" />
          </button>
        </Dialog.Trigger>
        <ATFAutoMasterEditDialog />
      </Dialog.Root>

      <div className="flex justify-center items-center text-center gap-4">
        <h3 className="font-bold text-neutral-400">Master</h3>
      </div>

      {/* Jetton balance */}
      <div className="flex items-center gap-2">
        <img src={ATFIcon} className="size-5 rounded-full" />
        <span className="text-4xl">
          {balances ? balances.jetton.toFixed(2) : "-.--"}
        </span>
        <span className="text-neutral-400">ATF</span>
      </div>

      {/* TON Balance */}
      <div className="flex items-center gap-2">
        <img src={TonIcon} className="size-4" />
        <span>{balances ? balances.ton.toFixed(4) : "-.----"}</span>
        <span className="text-neutral-400">TON</span>
      </div>

      {/* Address */}
      <button
        onClick={() => {
          copy(master.address);
          toast.success("Copied");
        }}
        className="font-mono flex items-center justify-center gap-1 text-blue-300"
      >
        <MdOutlineContentCopy /> <ATFAutoAddress address={master?.address} />
      </button>
      <ATFAutoVersionBadge version={master?.version} />
    </div>
  );
}

function searchAccount(account, searchTerm) {
  if (account.title?.toLowerCase().includes(searchTerm)) return true;
  if (account.address?.toLowerCase().includes(searchTerm)) return true;

  try {
    if (account.url) {
      const { initDataUnsafe } = extractTgWebAppData(account.url);
      const user = initDataUnsafe?.user;
      if (user) {
        if (user.id?.toString().includes(searchTerm)) return true;
        const fullName =
          `${user.first_name} ${user.last_name ?? ""}`.toLowerCase();
        if (fullName.includes(searchTerm)) return true;
        if (user.username?.toLowerCase().includes(searchTerm)) return true;
      }
    }
  } catch {
    // ignore
  }

  return false;
}

export default function ATFAutoDashboardTab() {
  const { accounts, storeAccounts } = useATFAuto();
  const [addOpen, setAddOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [tempSearch, setTempSearch] = useState("");
  const [search, setSearch] = useState("");

  useDebounce(() => setSearch(tempSearch), 300, [tempSearch]);

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? accounts.filter((account) => searchAccount(account, term))
      : accounts;
  }, [accounts, search]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearch("");
      setTempSearch("");
    }
  };

  const handleUpdateAccount = (updated) => {
    storeAccounts(accounts.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteAccount = (id) => {
    storeAccounts(accounts.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col gap-3 px-2">
      {/* Master Balance Card */}
      <MasterBalanceCard />

      {/* Add Account */}
      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Trigger asChild>
          <PrimaryButton>Add Account</PrimaryButton>
        </Dialog.Trigger>
        <ATFAutoNewAccountDialog onCreated={() => setAddOpen(false)} />
      </Dialog.Root>

      {/* Accounts Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-500 dark:text-neutral-400 font-bold">
          Accounts ({accounts.length})
        </h3>
        <button
          onClick={toggleSearch}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer transition-colors"
        >
          {showSearch ? (
            <MdOutlineClose className="size-5" />
          ) : (
            <MdOutlineSearch className="size-5" />
          )}
        </button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <Input
          autoFocus
          type="search"
          placeholder="Search accounts..."
          value={tempSearch}
          onChange={(e) => setTempSearch(e.target.value)}
        />
      )}

      {/* Accounts List */}
      {accounts.length > 0 ? (
        <Reorder.Group
          values={accounts}
          onReorder={(newOrder) => !search && storeAccounts(newOrder)}
          className="flex flex-col gap-2"
        >
          {filteredAccounts.map((account) => (
            <ATFAutoAccountItem
              key={account.id}
              account={account}
              accounts={accounts}
              onUpdate={handleUpdateAccount}
              onDelete={handleDeleteAccount}
            />
          ))}
        </Reorder.Group>
      ) : (
        <p className="text-center text-neutral-400 py-4">
          No accounts yet. Add one to get started.
        </p>
      )}
    </div>
  );
}
