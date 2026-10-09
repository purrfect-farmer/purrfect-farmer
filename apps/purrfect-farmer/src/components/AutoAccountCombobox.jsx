import { HiCheck, HiChevronUpDown } from "react-icons/hi2";
import { useMemo, useRef, useState } from "react";

import AutoAccountBalance from "./AutoAccountBalance";
import AutoAvatar from "./AutoAvatar";
import Input from "./Input";
import { Popover } from "radix-ui";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/utils";
import { searchAutoAccount } from "@purrfect/shared/lib/auto/wallet";
import useAuto from "@/hooks/useAuto";

/** Row height used to size the list until Virtuoso measures it */
const ROW_HEIGHT = 64;
const MAX_VISIBLE_ROWS = 5;

function truncateAddress(address) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Avatar for an option, the master getting its own badge */
function OptionAvatar({ option }) {
  if (option.isMaster) {
    return (
      <div
        className={cn(
          "size-8 shrink-0 rounded-full",
          "bg-blue-500 text-white font-bold",
          "flex items-center justify-center",
        )}
      >
        M
      </div>
    );
  }

  return (
    <AutoAvatar
      account={option}
      className="size-8 text-xs cursor-pointer active:cursor-pointer"
    />
  );
}

/** One wallet in the trigger or the list */
function OptionDetails({ option, showBalance = false }) {
  return (
    <div className="flex flex-col min-w-0 grow text-left">
      <span className="font-bold truncate">{option.title}</span>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
        {option.isMaster ? "Master wallet" : option.userId} ·{" "}
        {truncateAddress(option.address)}
      </span>
      {showBalance ? (
        <AutoAccountBalance account={option} className="text-xs" />
      ) : null}
    </div>
  );
}

/** Searchable picker over the master wallet and every Auto account */
export default function AutoAccountCombobox({
  value,
  onChange,
  disabled,
  includeMaster = true,
}) {
  const { master, accounts } = useAuto();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  /** Master first, then the accounts, all keyed by a string id */
  const options = useMemo(
    () => [
      ...(includeMaster && master
        ? [
            {
              id: "master",
              title: "Master",
              address: master.address,
              isMaster: true,
            },
          ]
        : []),
      ...accounts.map((account) => ({ ...account, id: String(account.id) })),
    ],
    [includeMaster, master, accounts],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;

    return options.filter((option) =>
      option.isMaster
        ? "master".includes(term) ||
          option.address?.toLowerCase().includes(term)
        : searchAutoAccount(option, term),
    );
  }, [options, search]);

  const selected = options.find((option) => option.id === value);

  /** Reset the search each time the list opens */
  const handleOpenChange = (next) => {
    setOpen(next);

    if (next) {
      setSearch("");
      setActiveIndex(
        Math.max(
          0,
          options.findIndex((option) => option.id === value),
        ),
      );
    }
  };

  const select = (option) => {
    onChange(option.id);
    setOpen(false);
  };

  /** Move the highlight and keep it in view */
  const moveActive = (index) => {
    const next = Math.min(Math.max(index, 0), filtered.length - 1);
    setActiveIndex(next);
    listRef.current?.scrollIntoView({ index: next });
  };

  const handleKeyDown = (ev) => {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      moveActive(activeIndex + 1);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      moveActive(activeIndex - 1);
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (filtered[activeIndex]) select(filtered[activeIndex]);
    }
  };

  const listHeight = Math.min(filtered.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        type="button"
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 w-full min-w-0 p-2 rounded-lg",
          "bg-neutral-100 dark:bg-neutral-700 cursor-pointer",
          "focus:outline-hidden focus:ring-3 focus:ring-blue-300",
          "disabled:opacity-50",
        )}
      >
        {selected ? (
          <>
            <OptionAvatar option={selected} />
            <OptionDetails option={selected} />
          </>
        ) : (
          <span className="grow text-left font-bold text-neutral-500">
            Choose account
          </span>
        )}
        <HiChevronUpDown className="size-5 shrink-0 text-neutral-400" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className={cn(
            "z-50 flex flex-col gap-2 p-2",
            "w-(--radix-popover-trigger-width)",
            "bg-white dark:bg-neutral-800 rounded-xl shadow-lg",
            "border border-neutral-200 dark:border-neutral-700",
          )}
        >
          {/* Search */}
          <Input
            autoFocus
            value={search}
            onChange={(ev) => {
              setSearch(ev.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder="Search title, ID or address"
          />

          {/* List */}
          {filtered.length ? (
            <Virtuoso
              ref={listRef}
              data={filtered}
              style={{ height: listHeight }}
              itemContent={(index, option) => (
                <button
                  type="button"
                  onClick={() => select(option)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-lg",
                    "cursor-pointer",
                    index === activeIndex
                      ? "bg-orange-100 dark:bg-neutral-700"
                      : null,
                  )}
                >
                  <OptionAvatar option={option} />
                  <OptionDetails option={option} showBalance />
                  {option.id === value ? (
                    <HiCheck className="size-5 shrink-0 text-orange-500" />
                  ) : null}
                </button>
              )}
            />
          ) : (
            <p className="p-4 text-center text-neutral-500">
              No accounts found
            </p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
