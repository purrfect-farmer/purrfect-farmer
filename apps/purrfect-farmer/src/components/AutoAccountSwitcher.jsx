import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { memo, useCallback, useMemo } from "react";

import Button from "./Button";
import { cn } from "@/utils";
import useAutoAccountDialog from "@/hooks/useAutoAccountDialog";

const EMPTY = [];

export default memo(function AutoAccountSwitcher({ account, className }) {
  const engine = useAutoAccountDialog();
  const accounts = engine?.accounts || EMPTY;
  const engineSwitch = engine?.switchAccount;

  const currentIndex = useMemo(
    () => accounts.findIndex((item) => item.id === account.id),
    [accounts, account.id],
  );

  /** Steps through the list and wraps at either end */
  const switchAccount = useCallback(
    (direction) => {
      const newIndex =
        direction === "next"
          ? (currentIndex + 1) % accounts.length
          : (currentIndex - 1 + accounts.length) % accounts.length;
      const newAccount = accounts[newIndex];

      if (newAccount.id === account.id) return;

      engineSwitch(newAccount.id);
    },
    [accounts, currentIndex, account.id, engineSwitch],
  );

  const showPrevious = useCallback(
    () => switchAccount("previous"),
    [switchAccount],
  );
  const showNext = useCallback(() => switchAccount("next"), [switchAccount]);

  /** Only the engine's open dialog switches, not a nested one for another account */
  if (engine?.dialog?.id !== account.id || accounts.length < 2) return null;

  return (
    <div
      className={cn(
        "flex gap-2 items-center justify-center shrink-0 p-2",
        className,
      )}
    >
      <Button
        type="button"
        variant="secondary"
        className="p-1 shrink-0"
        onClick={showPrevious}
      >
        <MdChevronLeft className="size-5" />
      </Button>

      <span className="min-w-16 text-center font-bold text-neutral-500 dark:text-neutral-400">
        {currentIndex + 1} / {accounts.length}
      </span>

      <Button
        type="button"
        variant="secondary"
        className="p-1 shrink-0"
        onClick={showNext}
      >
        <MdChevronRight className="size-5" />
      </Button>
    </div>
  );
});
