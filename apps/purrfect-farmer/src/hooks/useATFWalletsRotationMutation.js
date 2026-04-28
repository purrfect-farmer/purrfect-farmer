import ATFAutoWalletTransfer from "@/lib/ATFAutoWalletTransfer";
import { downloadFile } from "@/utils";
import { encryption } from "@/services/encryption";
import { getWalletFromMnemonic } from "@purrfect/shared/lib/atf-auto";
import { mnemonicNew } from "@ton/crypto";
import toast from "react-hot-toast";
import useATFAuto from "./useATFAuto";
import { useMutation } from "@tanstack/react-query";

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
    mutationFn: async () => {
      const { address: oldAddress, version, tonCenterApiKey } = master;

      /** Decrypt the old master wallet */
      console.log("Decrypting the old master wallet....");
      const oldPhrase = await encryption.decryptData({
        ...master.encryptedWalletPhrase,
        password,
        asText: true,
      });
      console.log("Successfully decrypted the old master wallet!");

      /** Generate new wallet */
      console.log("Generating new master wallet...");
      const newMnemonic = await mnemonicNew();
      const newPhrase = newMnemonic.join(" ");
      console.log("Successfully generated new master wallet!");

      /** Get new wallet address */
      const newKeypair = await getWalletFromMnemonic(newPhrase, version);
      const newAddress = newKeypair.address.toString({ bounceable: false });

      /** Rotate all accounts wallet */
      const accountsBackup = [];
      const updatedAccounts = [];

      for (const account of accounts) {
        const version = account.version;
        const oldAddress = account.address;
        const oldPhrase = await encryption.decryptData({
          ...account.encryptedPhrase,
          password,
          asText: true,
        });

        /** Generate new wallet */
        console.log("Generating new account wallet...");
        const newMnemonic = await mnemonicNew();
        const newPhrase = newMnemonic.join(" ");
        console.log("Successfully generated new account wallet!");

        /** Get new wallet address */
        const newKeypair = await getWalletFromMnemonic(newPhrase, version);
        const newAddress = newKeypair.address.toString({ bounceable: false });

        /** Encrypt new phrase */
        const newEncryptedPhrase = await encryption.encryptData({
          data: newPhrase,
          password,
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

      /** Create backup of old and new wallets */
      const backup = {
        master: {
          version,
          tonCenterApiKey,
          old: {
            address: oldAddress,
            phrase: oldPhrase,
          },
          new: {
            address: newAddress,
            phrase: newPhrase,
          },
        },
        accounts: accountsBackup,
      };

      /** Download backup file immediately */
      downloadFile(`atf-wallets-rotation-backup-${Date.now()}.json`, backup);

      /* Notify user of backup download */
      toast.success(
        "Backup of old and new wallet information downloaded before rotation!",
      );

      /** Prepare master wallet data */
      const oldMasterData = {
        address: oldAddress,
        phrase: oldPhrase,
        tonCenterApiKey,
        version,
      };

      const newMasterData = {
        address: newAddress,
        phrase: newPhrase,
        tonCenterApiKey,
        version,
      };

      console.log("Prepared old and new master wallet data for rotation.");
      console.log("Old Master Data:", oldMasterData);
      console.log("New Master Data:", newMasterData);

      /** Create wallet transfer instance */
      const walletRotation = new ATFAutoWalletTransfer(
        oldMasterData,
        newAddress,
      );

      /** Execute the wallet transfer */
      await walletRotation.transfer();

      /** Encrypt the new master wallet */
      const newEncryptedWalletPhrase = await encryption.encryptData({
        data: newPhrase,
        password,
      });

      /** Store updated master */
      dispatchAndStoreMaster({
        ...master,
        address: newAddress,
        encryptedWalletPhrase: newEncryptedWalletPhrase,
      });

      /** Store updated accounts */
      dispatchAndStoreAccounts(updatedAccounts);
    },
  });

  return mutation;
}
