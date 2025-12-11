/** Default Settings */
const defaultSharedSettings = {
  theme: "system",
  showMiniAppToolbar: true,
  farmersPerWindow: 5,
  farmerPosition: 1,
  openFarmerInNewWindow: true,
  openFarmerOnStartup: false,
  closeMainWindowOnStartup: false,
  enableMirror: typeof import.meta.env.VITE_WHISKER !== "undefined",
  mirrorServer: import.meta.env.VITE_MIRROR_SERVER,
  spiderApiKey: "",
  captchaEnabled: false,
  captchaProvider: "2captcha",
  captchaApiKey: "",
  proxyEnabled: false,
  proxyHost: "",
  proxyPort: "",
  proxyUsername: "",
  proxyPassword: "",
  shareCloudProxy: false,
  telegramClient: "purrfect-gram",
  preferredTelegramWebVersion: "k",
};

export default defaultSharedSettings;
