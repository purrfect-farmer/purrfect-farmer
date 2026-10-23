import CaptchaSolver from "@purrfect/shared/lib/CaptchaSolver.js";
import { DEFAULT_CAPTCHA_PROVIDER } from "@purrfect/shared/lib/captcha/providers.js";

export default new CaptchaSolver(
  env("CAPTCHA_PROVIDER", DEFAULT_CAPTCHA_PROVIDER),
  env("CAPTCHA_API_KEY")
);
