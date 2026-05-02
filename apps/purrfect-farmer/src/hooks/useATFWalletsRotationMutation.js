import { downloadFile } from "@/utils";
import { encryption } from "@/services/encryption";
import { getWalletFromMnemonic } from "@purrfect/shared/lib/atf-auto";
import { mnemonicNew } from "@ton/crypto";
import toast from "react-hot-toast";
import useATFAuto from "./useATFAuto";
import { useMutation } from "@tanstack/react-query";

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

export default function useATFWalletsRotationMutation() {
  const {
    master,
    accounts,
    password,
    dispatchAndStoreMaster,
    dispatchAndStoreAccounts,
  } = useATFAuto();

  const mutation = useMutation({
    mutationKey: ["atf-auto", "wallets", "rotation"],
    onError: (error) => {
      console.log("Error while rotating wallets", error);
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
      downloadFile(`atf-wallets-rotation-backup-${Date.now()}.json`, backup);

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
        const walletTransfer = new ATFAutoWalletTransfer(
          oldMasterData,
          newMasterAddress,
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
      dispatchAndStoreMaster({
        ...master,
        address: newMasterAddress,
        encryptedWalletPhrase: newEncryptedWalletPhrase,
      });

      /** Store updated accounts */
      if (updatedAccounts.length) {
        dispatchAndStoreAccounts(updatedAccounts);
      }
    },
  });

  return mutation;
}
