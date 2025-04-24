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
  theme: "system",
  preferredTelegramWebVersion: "k",
  farmerMode: import.meta.env.VITE_SETTING_FARMER_MODE || "web",
  farmerTitle: "TGUser",
  onboarded: import.meta.env.VITE_SETTING_ONBOARDED || false,
  closeOtherBots: true,
  enableInAppBrowser: true,
  enableCloud: false,
  enableSeeker: false,
  enableMirror: false,
  mirrorServer: import.meta.env.VITE_MIRROR_SERVER,
  cloudServer: import.meta.env.VITE_CLOUD_SERVER,
  seekerServer: import.meta.env.VITE_SEEKER_SERVER,
  seekerId: null,
  farmersLayout: "grid",
  displayUserInfo: true,
  showMiniAppToolbar: false,
  showLinksAsGrid: false,
  farmersPerWindow: 5,
  farmerPosition: 1,
  openFarmerInNewWindow: true,
  openFarmerOnStartup: false,
  uncappedPoints: false,
  closeMainWindowOnStartup: false,
  dropsStatus,
  dropsOrder,
  repeatZoomiesCycle: true,
};

export default defaultSettings;
