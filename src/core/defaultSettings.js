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
  farmerTitle: "TGUser",
  mirrorServer: import.meta.env.VITE_MIRROR_SERVER,
  cloudServer: import.meta.env.VITE_CLOUD_SERVER,
  seekerServer: import.meta.env.VITE_SEEKER_SERVER,
  seekerId: null,
  enableCloudSync: false,
  enableMirror: false,
  enableSeeker: false,
  closeOtherBots: true,
  farmersLayout: "grid",
  showMiniAppToolbar: false,
  showLinksAsGrid: false,
  farmersPerWindow: 5,
  farmerPosition: 1,
  openFarmerInNewWindow: true,
  openFarmerOnStartup: false,
  uncappedPoints: false,
  closeMainWindowOnStartup: false,
  preferredTelegramWebVersion: "k",
  dropsStatus,
  dropsOrder,
  repeatZoomiesCycle: true,
  theme: "system",
};

export default defaultSettings;
