import { MdOutlineLaunch } from "react-icons/md";
import { cn } from "@/utils";
import { launchWhiskersAccount } from "@/lib/whiskersAccounts";
import toast from "react-hot-toast";

/** Asks Purrfect Whiskers for this account's tile, so it renders nothing outside the Whiskers build */
export default function AutoAccountLaunchButton({ account, className }) {
  if (!import.meta.env.VITE_WHISKER || !account.userId) {
    return null;
  }

  return (
    <button
      type="button"
      title="Launch in Whiskers"
      onClick={() =>
        toast.promise(launchWhiskersAccount(account.userId), {
          loading: "Launching...",
          success: "Account launched",
          error: (error) => error.message,
        })
      }
      className={cn(
        "text-neutral-500 dark:text-neutral-400",
        "hover:bg-neutral-300 dark:hover:bg-neutral-500",
        "hover:text-black dark:hover:text-white",
        "p-1.5 rounded-lg shrink-0",
        "cursor-pointer transition-colors",
        className,
      )}
    >
      <MdOutlineLaunch className="size-5" />
    </button>
  );
}
