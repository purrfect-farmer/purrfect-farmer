import BaseTaskProvider from "../BaseTaskProvider.js";

export default class NoCaptchaAIProvider extends BaseTaskProvider {
  static id = "nocaptchaai";
  static title = "NoCaptchaAI";
  static baseURL = "https://api.nocaptchaai.com";
  static authProperty = "clientKey";
  static methods = {
    turnstile: "AntiTurnstileTask",
  };
}
