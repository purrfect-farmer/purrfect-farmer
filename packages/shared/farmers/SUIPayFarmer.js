import BaseInstantTaskFarmer from "../lib/BaseInstantTaskFarmer.js";

export default class SUIPayFarmer extends BaseInstantTaskFarmer {
  static id = "sui-pay";
  static title = "SUI Pay";
  static host = "suipay24.saifpowersoft.top";
  static domains = ["suipay24.saifpowersoft.top"];
  static telegramLink = "https://t.me/SUIPay009_bot?startapp=1147265290";
  static baseURL = `https://${this.host}/user`;
}
