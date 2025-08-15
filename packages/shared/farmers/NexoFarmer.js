import BaseInstantTaskFarmer from "../lib/BaseInstantTaskFarmer.js";

export default class NexoFarmer extends BaseInstantTaskFarmer {
  static id = "nexo";
  static title = "Nexo";
  static host = "tg.instatasker.online";
  static domains = ["tg.instatasker.online"];
  static telegramLink = "https://t.me/Nexo_ta_bot?startapp=1147265290";
  static baseURL = `https://${this.host}`;
}
