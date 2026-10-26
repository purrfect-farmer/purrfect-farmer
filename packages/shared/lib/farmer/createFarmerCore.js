/** The host services a farmer's modules work through, each read from the farmer at call time
 * @param {import("../BaseFarmer.js").default} farmer
 */
export default function createFarmerCore(farmer) {
  return Object.freeze({
    /** The farmer class, with any statics a runtime subclass overrides */
    get drop() {
      return farmer.constructor;
    },
    /** @type {import("axios").AxiosInstance} */
    get api() {
      return farmer.api;
    },
    /** @type {import("../BaseLogger.js").default} */
    get logger() {
      return farmer.logger;
    },
    get debugger() {
      return farmer.debugger;
    },
    get utils() {
      return farmer.utils;
    },
    get storage() {
      return farmer.storage;
    },
    get signal() {
      return farmer.signal;
    },
    get userAgent() {
      return farmer.userAgent;
    },
    get deviceLocale() {
      return farmer.deviceLocale;
    },
    get scheduled() {
      return farmer.scheduled;
    },
    get startParam() {
      return farmer.startParam;
    },
    get autoWalletProvider() {
      return farmer.autoWalletProvider;
    },
    /** The web app the farmer launched with: initData, platform, version and theme */
    get telegramWebApp() {
      return farmer.telegramWebApp;
    },

    userId: () => farmer.getUserId(),
    telegramUser: () => farmer.getTelegramUser(),
    username: () => farmer.getUsername(),
    userFirstName: () => farmer.getUserFirstName(),
    userLastName: () => farmer.getUserLastName(),
    userFullName: () => farmer.getUserFullName(),
    initData: () => farmer.getInitData(),
    initDataUnsafe: (camelCase) => farmer.getInitDataUnsafe(camelCase),
    referrerStartParam: () => farmer.getReferrerStartParam(),
    userRandom: () => farmer.getUserRandomGenerator(),
    requestId: () => farmer.makeRequestId(),
    adClientOptions: () => farmer.getAdClientOptions(),
    canPrompt: () => typeof farmer.promptInput === "function",
    prompt: (question) => farmer.promptInput(question),
    setAuth: () => farmer.setAuth(),
    notifyAdmin: (messages) => farmer.notifyAdmin(messages),
    notifyUser: (messages) => farmer.notifyUser(messages),

    captcha: Object.freeze({
      canSolveTurnstile: () => farmer.canSolveTurnstile(),
      solveTurnstile: (params) => farmer.solveTurnstile(params),
      canSolveImage: () => farmer.canSolveImage(),
      solveImage: (params) => farmer.solveImage(params),
    }),

    telegram: Object.freeze({
      validateTask: (link) => farmer.validateTelegramTask(link),
      tryToJoin: (link) => farmer.tryToJoinTelegramLink(link),
      tryToUpdateProfile: (options) => farmer.tryToUpdateProfile(options),
      openTaskLink: (url, dwellSeconds) =>
        farmer.openTaskLink(url, dwellSeconds),
    }),
  });
}
