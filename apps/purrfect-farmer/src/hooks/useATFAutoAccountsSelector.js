import { useCallback, useEffect, useState } from "react";

export default function useATFAutoAccountsSelector(accounts) {
  const [selectedAccounts, setSelectedAccounts] = useState(accounts);
  const allSelected = selectedAccounts.length === accounts.length;

  const toggleAccount = useCallback((account, checked) => {
    if (checked) {
      setSelectedAccounts((prev) => [...prev, account]);
    } else {
      setSelectedAccounts((prev) =>
        prev.filter((item) => item.id !== account.id)
      );
    }
  }, []);

  const toggleAllAccounts = useCallback(
    (checked) => {
      setSelectedAccounts(checked ? accounts : []);
    },
    [accounts]
  );

  useEffect(() => {
    setSelectedAccounts(accounts);
  }, [accounts]);

  return {
    accounts,
    allSelected,
    selectedAccounts,
    toggleAccount,
    toggleAllAccounts,
  };
}
