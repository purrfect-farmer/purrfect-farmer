import BaseInPhpProvider from "../BaseInPhpProvider.js";

export default class TwoCaptchaProvider extends BaseInPhpProvider {
  static id = "2captcha";
  static title = "2Captcha";
  static baseURL = "https://2captcha.com";
  static methods = {
    recaptcha: "userrecaptcha",
    turnstile: "turnstile",
    base64: "base64",
  };
}
