import {
  fetchAutoCloudWallets,
  getAccountCloudWallet,
  getCloudWalletStatus,
  indexCloudWallets,
} from "@/lib/autoCloudWallets";

import { useQuery } from "@tanstack/react-query";
import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";

/** The wallets the Cloud server stores for this drop, refreshed so a background push shows up */
export default function useAutoCloudWalletsQuery() {
  const { config } = useAuto();
  const { enabled, auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useQuery({
    enabled,
    select: indexCloudWallets,
    refetchInterval: 30_000,
    queryKey: [config.id, "cloud", "wallets", enabled, cloudServer],
    queryFn: ({ signal }) =>
      fetchAutoCloudWallets(cloudBackend, { drop: config.id, auth, signal }),
  });
}

/** One account's stored wallet and its status, null until the server has answered */
export function useAutoCloudWallet(account) {
  const { data } = useAutoCloudWalletsQuery();
  const row = data ? getAccountCloudWallet(data, account) : null;

  return {
    row,
    status: data ? getCloudWalletStatus(row, account) : null,
  };
}
