import BaseInstantTaskFarmer from "../lib/BaseInstantTaskFarmer.js";

export default class ShibbyFarmer extends BaseInstantTaskFarmer {
  static id = "shibby";
  static title = "Shibby";
  static host = "pollyautopaybot.botsmother.com";
  static domains = ["pollyautopaybot.botsmother.com"];
  static telegramLink = "https://t.me/pollyautopaybot?startapp=1147265290";
  static baseURL = `https://${this.host}`;
  static tasks = true;
}
