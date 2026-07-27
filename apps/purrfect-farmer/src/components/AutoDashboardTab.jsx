import { MdOutlineClose, MdOutlineSearch, MdPersonAdd } from "react-icons/md";
import { useMemo, useState } from "react";

import AutoAccountItem from "./AutoAccountItem";
import { AutoMasterBalanceCard } from "./AutoMasterBalanceCard";
import { AutoMasterCardActions } from "./AutoMasterCardActions";
import { AutoNetWorthCard } from "./AutoNetWorthCard";
import AutoNewAccountDialog from "./AutoNewAccountDialog";
import AutoStickyContainer from "./AutoStickyContainer";
import Alert from "./Alert";
import { Dialog } from "radix-ui";
import Input from "./Input";
import PrimaryButton from "./PrimaryButton";
import { Reorder } from "motion/react";
import { searchAutoAccount } from "@purrfect/shared/lib/auto/wallet";
import useAuto from "@/hooks/useAuto";
import { useDebounce } from "react-use";

export default function AutoDashboardTab() {
  const { accounts, dispatchAndStoreAccounts } = useAuto();
  const [addOpen, setAddOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [tempSearch, setTempSearch] = useState("");
  const [search, setSearch] = useState("");

  useDebounce(() => setSearch(tempSearch), 300, [tempSearch]);

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? accounts.filter((account) => searchAutoAccount(account, term))
      : accounts;
  }, [accounts, search]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearch("");
      setTempSearch("");
    }
  };
  /* Handle Update */
  const handleUpdateAccount = (updated) => {
    dispatchAndStoreAccounts(
      accounts.map((a) => (a.id === updated.id ? updated : a)),
    );
  };

  /* Handle delete */
  const handleDeleteAccount = (id) => {
    dispatchAndStoreAccounts(accounts.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Net Worth Card  */}
      <AutoNetWorthCard />

      {/* Master Balance Card */}
      <AutoMasterBalanceCard />

      {/* Actions */}
      <AutoMasterCardActions />

      {/* Rotation Alert */}
      <Alert variant={"danger"}>
        Make sure the wallets are rotated once before boosting accounts. <br />
        <strong className="font-bold">Note:</strong> Don't rotate when you
        haven't withdrawn all your accounts.
      </Alert>

      {/* Requests Alert */}
      <Alert variant={"warning"}>
        Disable requests by clicking the network toggle in the master balance
        card before boosting / collecting to speed up operations.
      </Alert>

      {/* Add Account */}

      <AutoStickyContainer>
        <div className="flex gap-2">
          {/* Add account button */}
          <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
            <Dialog.Trigger asChild>
              <PrimaryButton className={"grow"}>
                <MdPersonAdd className="size-4" />
                Add Account
              </PrimaryButton>
            </Dialog.Trigger>
            <AutoNewAccountDialog onCreated={() => setAddOpen(false)} />
          </Dialog.Root>
        </div>
      </AutoStickyContainer>

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
          onReorder={(newOrder) =>
            !search && dispatchAndStoreAccounts(newOrder)
          }
          className="flex flex-col gap-2"
        >
          {filteredAccounts.map((account) => (
            <AutoAccountItem
              key={account.id}
              account={account}
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
