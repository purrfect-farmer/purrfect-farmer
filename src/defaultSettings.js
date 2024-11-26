/** Drops Status */
const dropsStatus = {
  ["rekt"]: true,
  ["dreamcoin"]: true,
  ["notpixel"]: true,
  ["hrum"]: true,
  ["wonton"]: true,
  ["yescoin"]: true,
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
  closeMainWindowOnStartup: false,
  preferredTelegramWebVersion: "k",
  dropsStatus,
  dropsOrder,
  repeatZoomiesCycle: true,
};

export default defaultSettings;
