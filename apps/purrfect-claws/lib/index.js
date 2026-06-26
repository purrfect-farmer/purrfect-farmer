import CaptchaSolver from "@purrfect/shared/lib/CaptchaSolver.js";
import ProxyManager from "@purrfect/shared/lib/ProxyManager.js";

const proxyManager = new ProxyManager({
  provider: process.env.PROXY_PROVIDER,
  apiKey: process.env.PROXY_API_KEY,
  page: process.env.PROXY_PAGE ?? 1,
  pageSize: process.env.PROXY_PAGE_SIZE ?? 100,
});

const captchaSolver = new CaptchaSolver(
  process.env.CAPTCHA_PROVIDER,
  process.env.CAPTCHA_API_KEY,
);

export { proxyManager, captchaSolver };
