/** Drops Status */
const dropsStatus = {
  ["horse-go"]: true,
  ["funatic"]: true,
  ["gold-eagle"]: true,
  ["midas"]: true,
  ["zoo"]: true,
  ["hrum"]: true,
  ["tsubasa"]: true,
  ["dreamcoin"]: true,
  ["rekt"]: true,
};

/** Drops Order */
const dropsOrder = Object.keys(dropsStatus);

/** Default Settings */
const defaultSettings = {
  farmerTitle: "TGUser",
  syncServer: import.meta.env.VITE_SYNC_SERVER,
  cloudServer: import.meta.env.VITE_CLOUD_SERVER,
  closeOtherBots: true,
  farmersLayout: "grid",
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
