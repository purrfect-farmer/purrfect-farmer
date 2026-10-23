import CaptchaSolver from "@purrfect/shared/lib/CaptchaSolver.js";
import { DEFAULT_CAPTCHA_PROVIDER } from "@purrfect/shared/lib/captcha/providers.js";
import { check } from "./check.js";

/** Check the captcha API key by reading the balance */
export default async function testCaptcha(values, results) {
  await check(results, "API key", async () => {
    const solver = new CaptchaSolver(
      values.CAPTCHA_PROVIDER || DEFAULT_CAPTCHA_PROVIDER,
      values.CAPTCHA_API_KEY,
    );
    if (!solver.isConfigured()) throw new Error("API key is empty.");

    const balance = await solver.getBalance();
    return `Balance: ${balance}`;
  });
}
