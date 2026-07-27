import AutoContext from "@/contexts/AutoContext";
import AutoLogin from "@/components/AutoLogin";
import AutoMasterSetup from "@/components/AutoMasterSetup";
import AutoPanel from "@/components/AutoPanel";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useSharedStorageState from "@/hooks/useSharedStorageState";
import { useState } from "react";

/**
 * Wallet manager for a single Auto drop.
 *
 * Every drop gets its own master and sub-accounts: boost's "roll" mode drains a
 * whole master into a sub-account, so wallets are never shared across jettons.
 * Storage keys and mirrored-event names are namespaced by the drop's descriptor
 * — ATF keeps `atf-auto-*`, so existing wallets carry over untouched.
 *
 * @param {object} props
 * @param {object} props.config - the drop's auto descriptor (see `core/autos`)
 */
export default function Auto({ config }) {
  const [enableRequests, setEnableRequests] = useState(true);
  const [password, setPassword] = useState(null);
  const { value: master, storeValue: storeMaster } = useSharedStorageState(
    `${config.storagePrefix}-master`,
    null,
  );

  const { value: accounts, storeValue: storeAccounts } = useSharedStorageState(
    `${config.storagePrefix}-accounts`,
    [],
  );

  /** Set Password */
  const [, dispatchAndSetPassword] = useMirroredCallback(
    `${config.id}.set-password`,
    setPassword,
    [setPassword],
  );

  /** Store Master */
  const [, dispatchAndStoreMaster] = useMirroredCallback(
    `${config.id}.store-master`,
    storeMaster,
    [storeMaster],
  );

  /** Store Accounts */
  const [, dispatchAndStoreAccounts] = useMirroredCallback(
    `${config.id}.store-accounts`,
    storeAccounts,
    [storeAccounts],
  );

  const [resetAuto, dispatchAndResetAuto] = useMirroredCallback(
    `${config.id}.reset`,
    () => {
      setPassword(null);
      storeMaster(null);
      storeAccounts([]);
    },
    [setPassword, storeMaster, storeAccounts],
  );

  return (
    <AutoContext.Provider
      value={{
        config,
        master,
        password,
        accounts,
        storeAccounts,
        storeMaster,
        setPassword,
        resetAuto,
        enableRequests,
        setEnableRequests,
        dispatchAndSetPassword,
        dispatchAndStoreMaster,
        dispatchAndStoreAccounts,
        dispatchAndResetAuto,
      }}
    >
      {!master ? (
        <AutoMasterSetup />
      ) : password ? (
        <AutoPanel />
      ) : (
        <AutoLogin />
      )}
    </AutoContext.Provider>
  );
}
