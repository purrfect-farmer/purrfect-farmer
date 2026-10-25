import {
  accountWalletRemoval,
  getCloudErrorMessage,
  getPhrasePublicKey,
  getWalletPushScope,
  masterWalletRemoval,
  pushAutoCloudWallets,
} from "@/lib/autoCloudWallets";

import AutoWalletTransfer from "@/lib/AutoWalletTransfer";
import { downloadFile } from "@/utils";
import { encryption } from "@/services/encryption";
import { getWalletFromMnemonic } from "@purrfect/shared/lib/ton/wallet";
import { mnemonicNew } from "@ton/crypto";
import toast from "react-hot-toast";
import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function generateNewWallet({ password, encryptedPhrase, version = 5 }) {
  /** Decrypt the old wallet */
  console.log("Decrypting the old wallet....");
  const oldPhrase = await encryption.decryptData({
    ...encryptedPhrase,
    password,
    asText: true,
  });
  console.log("Successfully decrypted the old wallet!");

  /** Generate new wallet */
  console.log("Generating new master wallet...");
  const newMnemonic = await mnemonicNew();
  const newPhrase = newMnemonic.join(" ");
  console.log("Successfully generated new master wallet!");

  /** Get new wallet address */
  const newKeypair = await getWalletFromMnemonic(newPhrase, version);
  const newAddress = newKeypair.address.toString({ bounceable: false });

  return {
    oldPhrase,
    newPhrase,
    newKeypair,
    newAddress,
  };
}

/** The old wallets a rotation replaced, named by public key */
async function getReplacedWallets(oldMasterPhrase, backup, accounts) {
  const userIds = new Map(
    accounts.map((account) => [account.id, account.userId]),
  );
  const wallets = [
    masterWalletRemoval(await getPhrasePublicKey(oldMasterPhrase)),
  ];

  for (const item of backup) {
    const publicKey = await getPhrasePublicKey(item.old.phrase);

    wallets.push(accountWalletRemoval(publicKey, userIds.get(item.id)));
  }

  return wallets;
}

/** Store the rotated wallets on the Cloud server, which removes the ones they replaced once stored */
async function syncRotatedCloudWallets(
  cloudBackend,
  { drop, auth, password, master, accounts, oldMasterPhrase, backup },
) {
  try {
    await pushAutoCloudWallets(cloudBackend, {
      drop,
      auth,
      password,
      master,
      accounts,
      pushScope: getWalletPushScope(true, accounts.length > 0),
      replaces: await getReplacedWallets(oldMasterPhrase, backup, accounts),
    });
  } catch (error) {
    const reason = getCloudErrorMessage(error);

    toast.error(
      `Server wallets not updated: ${reason}. Push from the Wallets tab.`,
    );
  }
}

export default function useAutoWalletsRotationMutation() {
  const { config, master, accounts, password, storeMaster, storeAccounts } =
    useAuto();
  const { enabled: cloudEnabled, auth, cloudBackend } = useCloudQueryOptions();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [config.id, "wallets", "rotation"],
    onError: (error) => {
      console.log("Error while rotating wallets", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [config.id, "cloud", "wallets"],
      });
    },
    mutationFn: async ({ transferFunds = true, includeAccounts = true }) => {
      const { address: oldMasterAddress, version, tonCenterApiKey } = master;

      /** Decrypt the old master wallet */
      const {
        oldPhrase: oldMasterPhrase,
        newPhrase: newMasterPhrase,
        newAddress: newMasterAddress,
      } = await generateNewWallet({
        password,
        version: master.version,
        encryptedPhrase: master.encryptedWalletPhrase,
      });

      /** Rotate all accounts wallet */
      const accountsBackup = [];
      const updatedAccounts = [];

      if (includeAccounts) {
        for (const account of accounts) {
          const oldAddress = account.address;
          const { oldPhrase, newAddress, newPhrase } = await generateNewWallet({
            password,
            version: account.version,
            encryptedPhrase: account.encryptedPhrase,
          });

          /** Encrypt new phrase */
          const newEncryptedPhrase = await encryption.encryptData({
            password,
            data: newPhrase,
          });

          /** Push to updated accounts */
          updatedAccounts.push({
            ...account,
            address: newAddress,
            encryptedPhrase: newEncryptedPhrase,
          });

          /** Push to backup */
          accountsBackup.push({
            id: account.id,
            title: account.title,
            version: account.version,
            old: {
              address: oldAddress,
              phrase: oldPhrase,
            },
            new: {
              address: newAddress,
              phrase: newPhrase,
            },
          });
        }
      }

      /** Create backup of old and new wallets */
      const backup = {
        /** Master */
        master: {
          version,
          tonCenterApiKey,
          old: {
            address: oldMasterAddress,
            phrase: oldMasterPhrase,
          },
          new: {
            address: newMasterAddress,
            phrase: newMasterPhrase,
          },
        },
      };

      /** Add accounts */
      if (accountsBackup.length) {
        backup.accounts = accountsBackup;
      }

      /** Download backup file immediately */
      downloadFile(
        `${config.id}-wallets-rotation-backup-${Date.now()}.json`,
        backup,
      );

      /* Notify user of backup download */
      toast.success(
        "Backup of old and new wallet information downloaded before rotation!",
      );

      /** Transfer funds */
      if (transferFunds) {
        /** Prepare master wallet data */
        const oldMasterData = {
          address: oldMasterAddress,
          phrase: oldMasterPhrase,
          tonCenterApiKey,
          version,
        };

        /** Prepare master data */
        const newMasterData = {
          address: newMasterAddress,
          phrase: newMasterPhrase,
          tonCenterApiKey,
          version,
        };

        console.log("Prepared old and new master wallet data for rotation.");
        console.log("Old Master Data:", oldMasterData);
        console.log("New Master Data:", newMasterData);

        /** Create wallet transfer instance */
        const walletTransfer = new AutoWalletTransfer(
          oldMasterData,
          newMasterAddress,
          config.jettonAddress,
          { token: config.token },
        );

        /** Execute the wallet transfer */
        await walletTransfer.transfer();
      }

      /** Encrypt the new master wallet */
      const newEncryptedWalletPhrase = await encryption.encryptData({
        password,
        data: newMasterPhrase,
      });

      /** Store updated master */
      const updatedMaster = {
        ...master,
        address: newMasterAddress,
        encryptedWalletPhrase: newEncryptedWalletPhrase,
      };

      storeMaster(updatedMaster);

      /** Store updated accounts */
      if (updatedAccounts.length) {
        storeAccounts(updatedAccounts);
      }

      /** Replace the server's copies, a failure leaves the local rotation as it is */
      if (cloudEnabled) {
        await syncRotatedCloudWallets(cloudBackend, {
          drop: config.id,
          auth,
          password,
          master: updatedMaster,
          accounts: updatedAccounts,
          oldMasterPhrase,
          backup: accountsBackup,
        });
      }
    },
  });

  return mutation;
}
