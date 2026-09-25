import { CookieJar } from "tough-cookie";
import {
  HttpCookieAgent,
  HttpsCookieAgent,
  createCookieAgent,
} from "http-cookie-agent/http";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

const HttpProxyAgentWithCookies = createCookieAgent(HttpProxyAgent);
const HttpsProxyAgentWithCookies = createCookieAgent(HttpsProxyAgent);

/** Create HTTP Agent */
const createHttpAgent = ({
  proxy,
  cookieJar,
  isHttps = false,
  timeout = 30_000,
} = {}) => {
  const ProxyAgentType = isHttps ? HttpsProxyAgent : HttpProxyAgent;
  const ProxyAgentWithCookiesType = isHttps
    ? HttpsProxyAgentWithCookies
    : HttpProxyAgentWithCookies;
  const CookiesAgentType = isHttps ? HttpsCookieAgent : HttpCookieAgent;

  if (proxy) {
    return cookieJar
      ? new ProxyAgentWithCookiesType({
          timeout,
          cookies: { jar: cookieJar },
          proxy,
        })
      : new ProxyAgentType({ proxy, timeout });
  } else {
    return cookieJar
      ? new CookiesAgentType({ cookies: { jar: cookieJar }, timeout })
      : null;
  }
};

export {
  HttpProxyAgent,
  HttpsProxyAgent,
  HttpProxyAgentWithCookies,
  HttpsProxyAgentWithCookies,
  CookieJar,
  createHttpAgent,
};
