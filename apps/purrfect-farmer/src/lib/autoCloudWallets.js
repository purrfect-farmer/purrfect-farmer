import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role";

/** Store an Auto's wallets on the Cloud server, which decrypts them with the Auto's password */
export function pushAutoCloudWallets(
  cloudBackend,
  { drop, auth, password, master, accounts = [], pushScope },
) {
  return cloudBackend
    .post(`/api/auto/${drop}/push-wallets`, {
      auth,
      password,
      master,
      accounts,
      pushScope,
    })
    .then((res) => res.data);
}

/** Remove wallets from the Cloud server, each matched by address and role */
export function removeAutoCloudWallets(cloudBackend, { drop, auth, wallets }) {
  return cloudBackend
    .post(`/api/auto/${drop}/remove-wallets`, { auth, wallets })
    .then((res) => res.data);
}

/** The removal entry for an Auto's master wallet */
export const masterWalletRemoval = (address) => ({
  address,
  role: WALLET_ROLE.MASTER,
});

/** The removal entry for an Auto account's wallet */
export const accountWalletRemoval = (address, userId) => ({
  address,
  role: WALLET_ROLE.ACCOUNT,
  accountId: String(userId),
});

/** The server's reason for a failed Cloud request, or the request's own */
export const getCloudErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Unknown error";
