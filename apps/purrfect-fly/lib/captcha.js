import CaptchaSolver from "@purrfect/shared/lib/CaptchaSolver.js";

export default new CaptchaSolver(env("CAPTCHA_API_KEY"));
