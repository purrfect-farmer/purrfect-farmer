import LabelToggle from "@/components/LabelToggle";
import { HiOutlineWallet } from "react-icons/hi2";
import { memo } from "react";
import {
  SettingsGroup,
  SettingsInput,
  SettingsLabel,
} from "./SettingsComponents";

/** Settings for the wallets derived from each account's Telegram ID */
export default memo(function WalletOptionsGroup({
  sharedSettings,
  configureSharedSettings,
  dispatchAndConfigureSharedSettings,
}) {
  return (
    <SettingsGroup
      id={"wallet"}
      title={"Wallet Options"}
      icon={<HiOutlineWallet className="size-5" />}
    >
      {/* Auto-connect */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings(
            "autoConnectDerivedWallet",
            ev.target.checked,
          )
        }
        checked={sharedSettings?.autoConnectDerivedWallet}
      >
        Auto-connect Derived Wallet
      </LabelToggle>

      {/* Passphrase, kept on this device only */}
      <SettingsLabel>Derived Wallet Passphrase</SettingsLabel>
      <SettingsInput
        type="password"
        autoComplete="off"
        placeholder="Passphrase"
        initialValue={sharedSettings?.derivedWalletPassphrase}
        onConfirm={(passphrase) =>
          configureSharedSettings("derivedWalletPassphrase", passphrase)
        }
      />

      {/* Hint */}
      <p className="px-1 text-neutral-500 dark:text-neutral-400">
        Auto farmers without a wallet connect the W5 wallet derived from the
        account's Telegram ID, and new Auto accounts get it as their generated
        wallet. Nothing is derived without a passphrase. Use the same passphrase
        as the TON Wallet Deriver.
      </p>
    </SettingsGroup>
  );
});
