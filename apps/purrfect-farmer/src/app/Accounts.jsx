import AccountContext from "@/contexts/AccountContext";
import SharedContext from "@/contexts/SharedContext";
import useChromeCookies from "@/hooks/useChromeCookies";
import useNetRules from "@/hooks/useNetRules";
import useSharedCore from "@/hooks/useSharedCore";
import useWakeLock from "@/hooks/useWakeLock";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { createQueryClient } from "@/lib/createQueryClient";
import { useMemo } from "react";

import App from "./App";
import HeadlessMode from "./HeadlessMode";
import useTheme from "@/hooks/useTheme";

const FarmerAccount = ({ account }) => {
  const client = useMemo(() => createQueryClient(), []);

  return (
    <div
      className={cn("absolute inset-0", !account.active && "invisible")}
      data-account-id={account.id}
    >
      <AccountContext.Provider value={account}>
        <QueryClientProvider client={client}>
          <App />
        </QueryClientProvider>
      </AccountContext.Provider>
    </div>
  );
};

function Accounts() {
  const shared = useSharedCore();
  const { accounts, runningAccounts, headlessMode, sharedSettings } = shared;
  const { theme } = sharedSettings;

  /** Use Net Rules */
  useNetRules();

  /** Set Chrome Cookies */
  useChromeCookies();

  /** Acquire WakeLock */
  useWakeLock();

  /** Apply Theme */
  useTheme(theme);

  return (
    <SharedContext.Provider value={shared}>
      {headlessMode ? (
        <HeadlessMode />
      ) : (
        accounts.map(
          (account) =>
            runningAccounts.includes(account.id) && (
              <FarmerAccount key={account.id} account={account} />
            )
        )
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

export default Accounts;
