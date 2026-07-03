function getWhiskerSessions(list) {
  return list
    .map((item) => {
      const localTelegramSession =
        item?.backup?.data?.chromeLocalStorage?.[
          "account-default:local-telegram-session"
        ];

      return localTelegramSession;
    })
    .filter(Boolean);
}

export function whiskersToSessions(whiskersBackup) {
  const { backups, accounts } = whiskersBackup;
  const list = backups || accounts;
  return getWhiskerSessions(list);
}
