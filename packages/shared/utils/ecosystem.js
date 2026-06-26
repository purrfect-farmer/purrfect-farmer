export function whiskersToSessions(whiskersBackup) {
  const { backups } = whiskersBackup;

  return backups
    .map((item) => {
      const localTelegramSession =
        item.backup?.data?.chromeLocalStorage?.[
          "account-default:local-telegram-session"
        ];

      return localTelegramSession;
    })
    .filter(Boolean);
}
