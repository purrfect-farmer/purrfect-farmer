/** How each option `configure` takes is stored on the farmer, keyed by option name */
export const FARMER_OPTIONS = Object.freeze({
  api: (farmer, api) => {
    farmer.api = api;
  },
  utils: (farmer, utils) => {
    farmer.utils = utils;
  },
  logger: (farmer, logger) => {
    farmer.logger = logger;
  },
  captcha: (farmer, captcha) => {
    farmer.captcha = captcha;
  },
  userAgent: (farmer, userAgent) => {
    farmer.userAgent = userAgent;
  },
  /** The account's `{ timeZone, locale }` the device reports, the host's when unset */
  deviceLocale: (farmer, deviceLocale) => {
    farmer.deviceLocale = deviceLocale;
  },
  client: (farmer, client) => {
    farmer.client = client;
  },
  storage: (farmer, storage) => {
    farmer.storage = storage;
  },
  telegramWebApp: (farmer, telegramWebApp) => {
    farmer.telegramWebApp = telegramWebApp;
  },
  /** The signal follows its controller, so aborting it stops the run */
  controller: (farmer, controller) => {
    farmer.controller = controller;
    farmer.signal = controller.signal;
  },
  allowProfileUpdates: (farmer, allowProfileUpdates) => {
    farmer.allowProfileUpdates = Boolean(allowProfileUpdates);
  },
  quickRun: (farmer, quickRun) => {
    farmer.quickRun = Boolean(quickRun);
  },
  /** The prompts the terminal answers: { promptInput, promptAnswer, promptCancel } */
  prompts: (farmer, { promptInput, promptAnswer, promptCancel }) => {
    farmer.promptInput = promptInput;
    farmer.promptAnswer = promptAnswer;
    farmer.promptCancel = promptCancel;
  },
  /** { getSources(): Array<{ id, title, own, accounts, decryptPhrase(account, password) }> } */
  autoWalletProvider: (farmer, autoWalletProvider) => {
    farmer.autoWalletProvider = autoWalletProvider;
  },
  cacheAuth: (farmer, cacheAuth) => {
    farmer.cacheAuth = cacheAuth;
  },
  cacheTelegramWebApp: (farmer, cacheTelegramWebApp) => {
    farmer.cacheTelegramWebApp = cacheTelegramWebApp;
  },
});

/** Store each given option on the farmer, refusing names it does not know */
export function applyFarmerOptions(farmer, options) {
  for (const [name, value] of Object.entries(options)) {
    const apply = FARMER_OPTIONS[name];

    if (!apply) {
      throw new Error(`Unknown farmer option: ${name}`);
    }

    apply(farmer, value);
  }
}
