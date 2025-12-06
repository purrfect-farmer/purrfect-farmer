/** Default Settings */
const defaultSettings = {
  dropsStatus: {},
  dropsOrder: [],
  preferredTelegramWebVersion: "k",
  farmerMode: import.meta.env.VITE_SETTING_FARMER_MODE || "web",
  onboarded: import.meta.env.VITE_SETTING_ONBOARDED || false,
  enableInAppBrowser: true,
  miniAppInNewWindow: false,
  autoStartBot: true,
  closeOtherBots: true,
  enableCloud: false,
  enableSeeker: false,
  cloudServer: import.meta.env.VITE_CLOUD_SERVER,
  seekerServer: import.meta.env.VITE_SEEKER_SERVER,
  seekerId: null,
  farmersLayout: "grid",
  displayUserInfo: true,
  displayIpAddress: true,
  showLinksAsGrid: false,
  uncappedPoints: false,
  repeatZoomiesCycle: true,
  farmersRating: 0,
};

export default defaultSettings;
