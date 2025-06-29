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

const withPro = Object.values(
  import.meta.glob("@/../pro/src/hoc/withPro", {
    eager: true,
    import: "default",
  })
)[0];

const FarmerAccount = ({ account }) => {
  const client = useMemo(() => createQueryClient(), []);

  return (
    <div className={cn("absolute inset-0", !account.active && "invisible")}>
      <AccountContext.Provider value={account}>
        <QueryClientProvider client={client}>
          <App />
        </QueryClientProvider>
      </AccountContext.Provider>
    </div>
  );
};

function Accounts({ isPro = false }) {
  const shared = useSharedCore(isPro);
  const { accounts } = shared;

  /** Use Net Rules */
  useNetRules();

  /** Set Chrome Cookies */
  useChromeCookies();

  /** Acquire WakeLock */
  useWakeLock();

  return (
    <SharedContext.Provider value={shared}>
      {accounts.map((account) => (
        <FarmerAccount key={account.id} account={account} />
      ))}

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

export default withPro ? withPro(Accounts) : Accounts;
