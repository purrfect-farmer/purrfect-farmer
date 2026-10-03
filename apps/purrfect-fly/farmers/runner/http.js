import { Cookie } from "tough-cookie";
import {
  HttpCookieAgent,
  HttpsCookieAgent,
  createCookieAgent,
} from "http-cookie-agent/http";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import axios from "axios";
import {
  API_MAX_PROXY_RETRY_COUNT,
  API_MAX_RETRY_COUNT,
  API_RETRY_BASE_DELAY,
} from "./config.js";
import { isProxyConnectError, parseRetryAfter } from "./errors.js";

const HttpProxyAgentWithCookies = createCookieAgent(HttpProxyAgent);
const HttpsProxyAgentWithCookies = createCookieAgent(HttpsProxyAgent);

/** Build the runner's agents, axios instance and interceptors */
export function setupHttp(runner) {
  /** Agent */
  runner.httpAgent = createAgent(runner, false);
  runner.httpsAgent = createAgent(runner, true);

  /** Create API */
  runner.api = createApi(runner);

  /** Register Signal Interceptor */
  registerSignalInterceptor(runner);

  /** Apply Delay */
  runner.registerDelayInterceptor();

  /** Set XSRF */
  registerXSRFInterceptor(runner);

  /** Retry rate-limited requests */
  registerRetryInterceptor(runner);

  /** Log API Response */
  if (process.env.NODE_ENV !== "production") {
    registerLoggingInterceptor(runner);
  }

  /** Register extra interceptors */
  if (runner.configureApi) {
    runner.configureApi();
  }
}

/** Create HTTP Agent */
export function createAgent(runner, isHttps) {
  const { proxy, jar, cookies } = runner;
  const ProxyAgentType = isHttps ? HttpsProxyAgent : HttpProxyAgent;
  const ProxyAgentWithCookiesType = isHttps
    ? HttpsProxyAgentWithCookies
    : HttpProxyAgentWithCookies;
  const CookiesAgentType = isHttps ? HttpsCookieAgent : HttpCookieAgent;

  if (proxy) {
    return cookies
      ? new ProxyAgentWithCookiesType({
          timeout: 30_000,
          cookies: { jar },
          proxy,
        })
      : new ProxyAgentType({ proxy, timeout: 30_000 });
  } else {
    return cookies ? new CookiesAgentType({ cookies: { jar } }) : null;
  }
}

/** Create Axios Instance */
export function createApi(runner) {
  const host = runner.constructor.host;

  return axios.create({
    timeout: 60_000,
    httpAgent: runner.httpAgent,
    httpsAgent: runner.httpsAgent,
    headers: {
      common: {
        ["sec-ch-ua"]:
          '"Android WebView";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        ["sec-ch-ua-arch"]: '""',
        ["sec-ch-ua-arch-full-version"]: '""',
        ["sec-ch-ua-bitness"]: '""',
        ["sec-ch-ua-full-version-list"]: "",
        ["sec-ch-ua-mobile"]: "?0",
        ["sec-ch-ua-model"]: '""',
        ["sec-ch-ua-platform"]: '"Android"',
        ["sec-ch-ua-platform-version"]: '""',
        ["sec-fetch-dest"]: "empty",
        ["sec-fetch-mode"]: "cors",
        ["sec-fetch-site"]: "same-origin",
        ["x-requested-with"]: "org.telegram.messenger",
        ["User-Agent"]: runner.userAgent,
        ["Origin"]: `https://${host}`,
        ["Referer"]: `https://${host}/`,
        ["Referrer-Policy"]: "strict-origin-when-cross-origin",
        ["Cache-Control"]: "no-cache",
      },
    },
  });
}

/** Register Signal Interceptor */
function registerSignalInterceptor(runner) {
  runner.api.interceptors.request.use(async (config) => {
    if (!config.signal && runner.signal) {
      config.signal = runner.signal;
    }
    return config;
  });
}

/** Register XSRF Interceptor */
function registerXSRFInterceptor(runner) {
  if (!runner.constructor.withXSRFToken) return;

  runner.api.interceptors.request.use(async (config) => {
    const xsrfToken = (
      await runner.getCookies({ url: `https://${runner.constructor.host}` })
    ).find((cookie) => cookie.name === "XSRF-TOKEN")?.value;

    if (xsrfToken) {
      config.headers["X-XSRF-TOKEN"] = xsrfToken;
    }
    return config;
  });
}

/** Register Retry Interceptor */
function registerRetryInterceptor(runner) {
  runner.api.interceptors.response.use(null, async (error) => {
    const config = error.config;

    /** Retry proxy connection failures */
    if (config && isProxyConnectError(error)) {
      config.__proxyRetryCount = config.__proxyRetryCount || 0;

      if (config.__proxyRetryCount >= API_MAX_PROXY_RETRY_COUNT) {
        return Promise.reject(error);
      }

      config.__proxyRetryCount += 1;

      const delay = API_RETRY_BASE_DELAY * 2 ** (config.__proxyRetryCount - 1);

      runner.logger.warn(
        `[${runner.account.id}] Proxy error (${error.message}) on ${config.url}. Retrying in ${delay}ms (attempt ${config.__proxyRetryCount}/${API_MAX_PROXY_RETRY_COUNT})`,
      );

      await runner.utils.delay(delay, { signal: runner.signal });

      return runner.api(config);
    }

    /** If no config or response, reject the error */
    if (!config || !error.response) {
      return Promise.reject(error);
    }

    /** Only retry rate-limited (429) responses */
    if (error.response?.status !== 429) {
      /** Determine if the request should be explicitly retried */
      const shouldRetry =
        typeof runner.shouldRetryRequest === "function"
          ? runner.shouldRetryRequest(error)
          : true;

      /** If not explicitly retried, reject the error */
      if (!shouldRetry) {
        return Promise.reject(error);
      }
    }

    /** Track retry count on the request config */
    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount >= API_MAX_RETRY_COUNT) {
      return Promise.reject(error);
    }

    /** Increment retry count */
    config.__retryCount += 1;

    /** Respect Retry-After header, else exponential backoff */
    const retryAfter = parseRetryAfter(error.response.headers?.["retry-after"]);
    const backoff = API_RETRY_BASE_DELAY * 2 ** (config.__retryCount - 1);
    const delay = retryAfter ?? backoff;

    runner.logger.warn(
      `[${runner.account.id}] Rate limited (429) on ${config.url}. Retrying in ${delay}ms (attempt ${config.__retryCount}/${API_MAX_RETRY_COUNT})`,
    );

    /** Wait before retrying (aborts cleanly on termination) */
    await runner.utils.delay(delay, { signal: runner.signal });

    /** Replay the original request */
    return runner.api(config);
  });
}

/** Log API Requests */
function registerLoggingInterceptor(runner) {
  const { logger, utils } = runner;

  /** Format one request line */
  const format = (config, status, color) => {
    const title = utils.truncateAndPad(runner.account.id, 10);
    const method = utils.truncateAndPad(config.method.toUpperCase(), 4);

    return `${logger.chalk.bold.blue(`${title}`)} ${logger.chalk.bold.cyan(
      `${method}`,
    )} ${logger.chalk.bold[color](
      `${utils.truncateAndPad(status, 3)} ${config.url}`,
    )}`;
  };

  runner.api.interceptors.response.use(
    (response) => {
      logger.output(format(response.config, response.status, "green"));
      return response;
    },
    (error) => {
      logger.log(format(error.config, error.response?.status || "ERR", "red"));
      return Promise.reject(error);
    },
  );
}

/** Get Cookies */
export async function getCookies(jar, url) {
  const cookies = await jar.getCookies(url);
  return cookies.map((cookie) => ({
    name: cookie.key,
    value: cookie.value,
  }));
}

/** Restore saved cookies into the jar */
export async function restoreCookies(jar, list = []) {
  for (const item of list) {
    for (const cookie of item.cookies) {
      await jar.setCookie(
        new Cookie({
          ...cookie,
          key: cookie.key || cookie.name,
          expiryTime: cookie.expiryTime || cookie.expirationDate,
        }),
        item.url,
      );
    }
  }
}
