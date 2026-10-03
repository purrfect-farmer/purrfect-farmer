import TwoCaptchaProvider from "./providers/TwoCaptchaProvider.js";
import CaptchaAIProvider from "./providers/CaptchaAIProvider.js";
import SolveCaptchaProvider from "./providers/SolveCaptchaProvider.js";
import CaptchaSonicProvider from "./providers/CaptchaSonicProvider.js";
import NoCaptchaAIProvider from "./providers/NoCaptchaAIProvider.js";
import NSLSolverProvider from "./providers/NSLSolverProvider.js";

/** Available captcha providers */
export const CAPTCHA_PROVIDERS = [
  TwoCaptchaProvider,
  CaptchaAIProvider,
  SolveCaptchaProvider,
  CaptchaSonicProvider,
  NoCaptchaAIProvider,
  NSLSolverProvider,
];

/** Create a provider instance by id */
export function createCaptchaProvider(id, apiKey) {
  const Provider = CAPTCHA_PROVIDERS.find((item) => item.id === id);

  if (!Provider) {
    throw new Error(`Unsupported captcha provider: ${id}`);
  }

  return new Provider(apiKey);
}
