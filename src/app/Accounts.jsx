import AccountContext from "@/contexts/AccountContext";
import FullSpinner from "@/components/FullSpinner";
import SharedContext from "@/contexts/SharedContext";
import useChromeCookies from "@/hooks/useChromeCookies";
import useNetRules from "@/hooks/useNetRules";
import useSharedCore from "@/hooks/useSharedCore";
import useTelegramWebAppEvents from "@/hooks/useTelegramWebAppEvents";
import useWakeLock from "@/hooks/useWakeLock";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { createQueryClient } from "@/lib/createQueryClient";
import { useMemo } from "react";

import App from "./App";

const FarmerAccount = ({ account }) => {
  const client = useMemo(() => createQueryClient(), []);

  return (
    <div
      className={cn(
        "absolute inset-0",
        !account.active && "pointer-events-none opacity-0"
      )}
    >
      <AccountContext.Provider value={account}>
        <QueryClientProvider client={client}>
          <App />
        </QueryClientProvider>
      </AccountContext.Provider>
    </div>
  );
};

export default function Accounts() {
  const shared = useSharedCore();
  const { accounts, hasRestoredAccounts, activeAccount } = shared;

  /** Use Net Rules */
  useNetRules();

  /** Set Chrome Cookies */
  useChromeCookies();

  /** Acquire WakeLock */
  useWakeLock();

  /** Use TelegramWebApp Events */
  useTelegramWebAppEvents();

  return (
    <SharedContext.Provider value={shared}>
      {hasRestoredAccounts ? (
        accounts.map((account) => (
          <FarmerAccount
            key={account.id}
            account={{
              ...account,
              active: account.id === activeAccount,
            }}
          />
        ))
      ) : (
        <div className="flex flex-col h-dvh">
          <FullSpinner />
        </div>
      )}

      {/* Toaster */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          loading: {
            duration: Infinity,
          },
        }}
      />
    </SharedContext.Provider>
  );
}
