import BaseInPhpProvider from "../BaseInPhpProvider.js";

export default class SolveCaptchaProvider extends BaseInPhpProvider {
  static id = "solvecaptcha";
  static title = "SolveCaptcha";
  static baseURL = "https://api.solvecaptcha.com";
  static methods = {
    turnstile: "turnstile",
    base64: "base64",
  };
}
