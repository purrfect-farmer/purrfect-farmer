/** Drops Status */
const dropsStatus = {
  ["money-bux"]: true,
  ["space-adventure"]: true,
  ["digger"]: true,
  ["gold-eagle"]: true,
  ["funatic"]: true,
  ["matchquest"]: true,
  ["hrum"]: true,
  ["tsubasa"]: true,
  ["wonton"]: true,
  ["slotcoin"]: true,
  ["dreamcoin"]: true,
};

/** Drops Order */
const dropsOrder = Object.keys(dropsStatus);

/** Default Settings */
const defaultSettings = {
  dropsStatus,
  dropsOrder,
  theme: "system",
  preferredTelegramWebVersion: "k",
  farmerMode: import.meta.env.VITE_SETTING_FARMER_MODE || "web",
  onboarded: import.meta.env.VITE_SETTING_ONBOARDED || false,
  enableInAppBrowser: true,
  miniAppInNewWindow: false,
  autoStartBot: true,
  closeOtherBots: true,
  enableCloud: false,
  enableSeeker: false,
  enableMirror: typeof import.meta.env.VITE_WHISKER !== "undefined",
  mirrorServer: import.meta.env.VITE_MIRROR_SERVER,
  cloudServer: import.meta.env.VITE_CLOUD_SERVER,
  seekerServer: import.meta.env.VITE_SEEKER_SERVER,
  seekerId: null,
  farmersLayout: "grid",
  displayUserInfo: true,
  displayIpAddress: true,
  showLinksAsGrid: false,
  uncappedPoints: false,
  repeatZoomiesCycle: true,
};

export default defaultSettings;
