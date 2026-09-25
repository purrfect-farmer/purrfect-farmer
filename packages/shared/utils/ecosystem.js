function getWhiskerEntries(list) {
  return list
    .map((item) => {
      const chromeLocalStorage = item?.backup?.data?.chromeLocalStorage;
      const session =
        chromeLocalStorage?.["account-default:local-telegram-session"];

      if (!session) return null;

      /** Title the user gave the account in Whiskers */
      const title =
        item?.account?.title ||
        chromeLocalStorage?.["shared:accounts"]?.[0]?.title ||
        null;

      return { session, title };
    })
    .filter(Boolean);
}

export function whiskersToEntries(whiskersBackup) {
  const { backups, accounts } = whiskersBackup;
  const list = backups || accounts;
  return getWhiskerEntries(list);
}

export function whiskersToSessions(whiskersBackup) {
  return whiskersToEntries(whiskersBackup).map((item) => item.session);
}

export function normalizeWhiskersBackup(whiskersBackup) {
  let { backups, accounts } = whiskersBackup;
  if (!accounts) {
    accounts = whiskersBackup.app.accounts.map((item) => {
      return {
        account: item,
        backup: backups.find((backup) => backup.partition === item.partition)
          ?.backup,
      };
    });
  }
  return accounts;
}

export function whiskersToProfiles(whiskersBackup) {
  const list = normalizeWhiskersBackup(whiskersBackup);
  return list.map((item) => {
    const chromeLocalStorage = item.backup?.data?.chromeLocalStorage;
    return {
      ...item,
      session: chromeLocalStorage?.["account-default:local-telegram-session"],
    };
  });
}
