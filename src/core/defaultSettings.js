/** Drops Status */
const dropsStatus = {
  ["funatic"]: true,
  ["gold-eagle"]: true,
  ["midas"]: true,
  ["zoo"]: true,
  ["hrum"]: true,
  ["tsubasa"]: true,
  ["dreamcoin"]: true,
  ["rekt"]: true,
  ["wonton"]: true,
};

/** Drops Order */
const dropsOrder = Object.keys(dropsStatus);

/** Default Settings */
const defaultSettings = {
  theme: "system",
  preferredTelegramWebVersion: "k",
  farmerTitle: "TGUser",
  closeOtherBots: true,
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
