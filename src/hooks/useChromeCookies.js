import setCookie from "set-cookie-parser";
import { customLogger, isExtension } from "@/lib/utils";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

export default function useChromeCookies(enabled = false, netRequest) {
  const origin = netRequest?.origin;
  const urls = useMemo(
    () => netRequest && netRequest.domains.map((domain) => `*://${domain}/*`),
    [netRequest]
  );

  useLayoutEffect(() => {
    if (isExtension() || enabled === false) return;

    const listener = (ev) => {
      ev.responseHeaders
        .filter((item) => item.name === "set-cookie")
        .forEach((header) => {
          const parsed = setCookie.parseString(header.value);
          const cookie = {
            url: origin,
            domain: parsed.domain,
            name: parsed.name,
            path: parsed.path,
            value: parsed.value,
            httpOnly: parsed.httpOnly,
            secure: parsed.secure,
            sameSite: "no_restriction",
          };

          if (typeof parsed.maxAge !== "undefined") {
            cookie.expirationDate =
              Math.floor(Date.now() / 1000) + parsed.maxAge;
          } else if (parsed.expires instanceof Date) {
            cookie.expirationDate = Math.floor(parsed.expires.getTime() / 1000);
          }

          customLogger("COOKIE", parsed, cookie);

          chrome.cookies.set(cookie);
        });
    };

    chrome.webRequest.onHeadersReceived.addListener(listener, { urls }, [
      "responseHeaders",
      "extraHeaders",
    ]);

    return () => chrome.webRequest.onHeadersReceived.removeListener(listener);
  }, [origin, urls]);
}
