import ATFAutoContext from "@/contexts/ATFAutoContext";
import ATFAutoLogin from "@/components/ATFAutoLogin";
import ATFAutoMasterSetup from "@/components/ATFAutoMasterSetup";
import ATFAutoPanel from "@/components/ATFAutoPanel";
import useSharedStorageState from "@/hooks/useSharedStorageState";
import { useState } from "react";

export default function ATFAuto() {
  const [password, setPassword] = useState(null);
  const { value: master, storeValue: storeMaster } = useSharedStorageState(
    "atf-auto-master",
    null,
  );

  const { value: accounts, storeValue: storeAccounts } = useSharedStorageState(
    "atf-auto-accounts",
    [],
  );

  const resetATFAuto = () => {
    setPassword(null);
    storeMaster(null);
    storeAccounts([]);
  };

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
