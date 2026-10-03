import BaseInPhpProvider from "../BaseInPhpProvider.js";

export default class CaptchaAIProvider extends BaseInPhpProvider {
  static id = "captchaai";
  static title = "CaptchaAI";
  static baseURL = "https://ocr.captchaai.com";
  static methods = {
    turnstile: "turnstile",
    base64: "base64",
  };
}
