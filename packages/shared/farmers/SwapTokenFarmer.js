import BaseInstantTaskFarmer from "../lib/BaseInstantTaskFarmer.js";

export default class SwapTokenFarmer extends BaseInstantTaskFarmer {
  static id = "swap-token";
  static title = "Swap Token";
  static host = "swaptokenbot.xyz";
  static domains = ["swaptokenbot.xyz"];
  static telegramLink = "https://t.me/SwapToken_bot?startapp=1147265290";
  static baseURL = `https://${this.host}`;
  static tasks = true;
}
