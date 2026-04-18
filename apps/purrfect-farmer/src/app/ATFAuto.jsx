import ATFAutoContext from "@/contexts/ATFAutoContext";
import ATFAutoLogin from "@/components/ATFAutoLogin";
import ATFAutoMasterSetup from "@/components/ATFAutoMasterSetup";
import ATFAutoPanel from "@/components/ATFAutoPanel";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useSharedStorageState from "@/hooks/useSharedStorageState";
import { useState } from "react";

export default function ATFAuto() {
  const [enableRequests, setEnableRequests] = useState(true);
  const [password, setPassword] = useState(null);
  const { value: master, storeValue: storeMaster } = useSharedStorageState(
    "atf-auto-master",
    null,
  );

  const { value: accounts, storeValue: storeAccounts } = useSharedStorageState(
    "atf-auto-accounts",
    [],
  );

  /** Set Password */
  const [, dispatchAndSetPassword] = useMirroredCallback(
    "atf-auto.set-password",
    setPassword,
    [setPassword],
  );

  /** Store Master */
  const [, dispatchAndStoreMaster] = useMirroredCallback(
    "atf-auto.store-master",
    storeMaster,
    [storeMaster],
  );

  /** Store Accounts */
  const [, dispatchAndStoreAccounts] = useMirroredCallback(
    "atf-auto.store-accounts",
    storeAccounts,
    [storeAccounts],
  );

  const [resetATFAuto, dispatchAndResetATFAuto] = useMirroredCallback(
    "atf-auto.reset",
    () => {
      setPassword(null);
      storeMaster(null);
      storeAccounts([]);
    },
    [setPassword, storeMaster, storeAccounts],
  );

  return (
    <ATFAutoContext.Provider
      value={{
        master,
        password,
        accounts,
        storeAccounts,
        storeMaster,
        setPassword,
        resetATFAuto,
        enableRequests,
        setEnableRequests,
        dispatchAndSetPassword,
        dispatchAndStoreMaster,
        dispatchAndStoreAccounts,
        dispatchAndResetATFAuto,
      }}
    >
      {!master ? (
        <ATFAutoMasterSetup />
      ) : password ? (
        <ATFAutoPanel />
      ) : (
        <ATFAutoLogin />
      )}
    </ATFAutoContext.Provider>
  );
}
