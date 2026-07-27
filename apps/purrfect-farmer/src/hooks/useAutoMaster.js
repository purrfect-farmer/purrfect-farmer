import { encryption } from "@/services/encryption";
import { prepareMaster } from "@purrfect/shared/lib/auto/transactions";
import useAuto from "./useAuto";
import { useCallback } from "react";

/**
 * Decrypting the master wallet and opening it against the drop's jetton is the
 * first step of every local on-chain operation, so it lives here rather than
 * being repeated in each mutation.
 */
export default function useAutoMaster() {
  const { config, master, password } = useAuto();

  /** Decrypt a stored wallet phrase with the session password */
  const decryptPhrase = useCallback(
    (encryptedPhrase) =>
      encryption.decryptData({
        ...encryptedPhrase,
        password,
        asText: true,
      }),
    [password],
  );

  /** Decrypt the master wallet into the shape the TON helpers expect */
  const buildMasterData = useCallback(async () => {
    const phrase = await decryptPhrase(master.encryptedWalletPhrase);

    return {
      address: master.address,
      version: master.version,
      phrase,
      tonCenterApiKey: master.tonCenterApiKey,
    };
  }, [master, decryptPhrase]);

  /** Decrypt and open the master wallet against this drop's jetton */
  const prepare = useCallback(async () => {
    const masterData = await buildMasterData();
    const prepared = await prepareMaster(masterData, config.jettonAddress);

    return { masterData, prepared };
  }, [buildMasterData, config.jettonAddress]);

  return { decryptPhrase, buildMasterData, prepare };
}
