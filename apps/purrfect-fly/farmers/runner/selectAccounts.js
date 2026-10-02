/**
 * Decide which subscribed accounts run this batch
 * @param {object} options
 * @param {Array} options.accounts - subscribed accounts, each with its optional farmer
 * @param {string|number} [options.user] - restrict the run to one account
 * @param {Set} options.terminated - account ids excluded from batches
 * @param {number} options.primaryAccountId
 * @param {string} options.platform
 * @param {boolean} options.autoStart
 * @param {string} options.referrerMode
 * @param {boolean} options.primaryLinkResolved
 */
export default function selectAccounts({
  accounts: accountsWithFarmer,
  user,
  terminated,
  primaryAccountId,
  platform,
  autoStart,
  referrerMode,
  primaryLinkResolved,
}) {
  /** Fetch Subscribed Accounts */
  let subscribedList = accountsWithFarmer;

  /** Filter accounts with farmer when the platform requires one */
  if (platform !== "telegram") {
    subscribedList = subscribedList.filter((item) => item.farmer);
  }

  /** Filter by user if specified */
  if (user) {
    subscribedList = subscribedList.filter(
      (item) => Number(item.id) === Number(user),
    );
  }

  /** Filter out frozen, banned, terminated and non-farming accounts */
  const accounts = subscribedList.filter((item) => {
    return (
      !["frozen", "banned"].includes(item.farmer?.status) &&
      !terminated.has(item.id) &&
      item.farmingEnabled
    );
  });

  /** Primary account */
  const primaryAccount = primaryAccountId
    ? accounts.find((acc) => acc.id === primaryAccountId)
    : null;

  /** Can launch primary account */
  const canLaunchPrimaryAccount =
    primaryAccount?.farmer?.status === "active" ||
    Boolean(primaryAccount?.session);

  /** Accounts without farmer may be auto-started */
  const autoStartEnabled = autoStart && platform === "telegram";

  /** Single referrer mode waits for the primary link */
  const canAutoStart =
    autoStartEnabled &&
    canLaunchPrimaryAccount &&
    (referrerMode !== "single" || primaryLinkResolved);

  /** Get accounts to be executed */
  const executable = accounts.filter((account) => {
    const accountIsActive = account.farmer?.status === "active";

    /** The primary account may always auto-start to resolve its link */
    const isPrimary = autoStartEnabled && account.id === primaryAccountId;

    /** A farmer can be automatically created for an account with an active telegram session */
    return (
      accountIsActive || Boolean(account.session && (canAutoStart || isPrimary))
    );
  });

  /** Skipped accounts */
  const skipped = accountsWithFarmer.filter(
    (account) => !executable.some((item) => item.id === account.id),
  );

  return { primaryAccount, executable, skipped };
}

/** Give proxies of skipped accounts to executable accounts without one */
export function assignUnusedProxies(executable, skipped) {
  const unusedProxies = skipped
    .filter((account) => account.proxy)
    .map((account) => account.proxy);

  executable.forEach((account) => {
    if (account.proxy) {
      return;
    }

    const proxy = unusedProxies.shift();
    if (proxy) {
      account.proxy = proxy;
    }
  });
}
