import ATFAutoMasterWalletRotation from "@/lib/ATFAutoMasterWalletRotation";
import { downloadFile } from "@/utils";
import { encryption } from "@/services/encryption";
import { getWalletFromMnemonic } from "@/lib/atf-auto";
import { mnemonicNew } from "@ton/crypto";
import toast from "react-hot-toast";
import useATFAuto from "./useATFAuto";
import { useMutation } from "@tanstack/react-query";

export default function useATFMasterWalletRotationMutation() {
  const { master, password, dispatchAndStoreMaster } = useATFAuto();

  const mutation = useMutation({
    mutationKey: ["atf-auto-master-wallet-rotation"],
    onError: (error) => {
      console.log("Error while rotating master wallet", error);
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

      /** Create backup of old and new wallet information */
      const backup = {
        old: {
          address: oldAddress,
          phrase: oldPhrase,
        },
        new: {
          address: newAddress,
          phrase: newPhrase,
        },
        tonCenterApiKey,
        version,
      };

      /** Download backup file immediately */
      downloadFile(
        `atf-master-wallet-rotation-backup-${Date.now()}.json`,
        backup,
      );

      /* Notify user of backup download */
      toast.success(
        "Backup of old and new master wallet information downloaded before rotation!",
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

      /** Create wallet rotation instance */
      const walletRotation = new ATFAutoMasterWalletRotation(
        oldMasterData,
        newMasterData,
      );

      /** Execute the wallet rotation */
      await walletRotation.rotate();

      /** Encrypt the new master wallet */
      const newEncryptedWalletPhrase = await encryption.encryptData({
        data: newPhrase,
        password,
      });

      dispatchAndStoreMaster({
        ...master,
        address: newAddress,
        encryptedWalletPhrase: newEncryptedWalletPhrase,
      });
    },
  });

  return mutation;
}
