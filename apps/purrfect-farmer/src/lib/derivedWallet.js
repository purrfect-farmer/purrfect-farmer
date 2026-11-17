import defaultSharedSettings from "@/core/defaultSharedSettings";
import storage from "@/lib/storage";
import { deriveWalletFromTelegramId } from "@purrfect/shared/lib/ton/wallet";
import { mnemonicNew } from "@ton/crypto";
import { sharedStorageKey } from "@/lib/storageKeys";

/** The derived wallet settings, read straight out of the shared settings */
export function getDerivedWalletSettings() {
  /* Read the stored shared settings over their defaults */
  const settings = {
    ...defaultSharedSettings,
    ...storage.get(sharedStorageKey("settings")),
  };

  return {
    autoConnect: Boolean(settings.autoConnectDerivedWallet),
    passphrase: settings.derivedWalletPassphrase || "",
  };
}

/** The wallet derived for a Telegram ID, or null without a numeric ID or a passphrase */
export function getDerivedWallet(userId, version = 5) {
  const { passphrase } = getDerivedWalletSettings();

  return deriveWalletFromTelegramId(userId, passphrase, version);
}

/** A phrase for a new account wallet: derived when its Telegram ID and the passphrase are known, else random */
export async function generateAccountPhrase(userId) {
  /* Prefer the derived wallet */
  const wallet = await getDerivedWallet(userId);

  if (wallet) return { phrase: wallet.phrase, derived: true };

  /* Fall back to a random one */
  const mnemonic = await mnemonicNew();

  return { phrase: mnemonic.join(" "), derived: false };
}
