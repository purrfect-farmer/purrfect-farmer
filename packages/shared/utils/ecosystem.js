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
