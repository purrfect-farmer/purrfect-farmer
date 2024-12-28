/** Drops Status */
const dropsStatus = {
  ["battle-bulls"]: true,
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
  syncServer: "127.0.0.1:7777",
  closeOtherBots: true,
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
