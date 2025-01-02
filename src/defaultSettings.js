/** Drops Status */
const dropsStatus = {
  ["midas"]: true,
  ["zoo"]: true,
  ["hrum"]: true,
  ["tsubasa"]: true,
  ["dreamcoin"]: true,
  ["rekt"]: true,
  ["wonton"]: true,
  ["yescoin"]: true,
  ["blum"]: true,
};

/** Drops Order */
const dropsOrder = Object.keys(dropsStatus);

/** Default Settings */
const defaultSettings = {
  farmerTitle: "TGUser",
  syncServer: "127.0.0.1:7777",
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
