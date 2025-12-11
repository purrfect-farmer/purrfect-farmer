import farmers from "@/core/farmers";
import setCookie from "set-cookie-parser";
import { customLogger } from "@/utils";
import { useLayoutEffect } from "react";
import { useMemo } from "react";

export default function useChromeCookies() {
  const targets = useMemo(
    () =>
      farmers
        .filter((item) => item.apiOptions?.withCredentials === true)
        .map((item) => ({
          origin: item.netRequest.origin,
          urls: item.netRequest.domains.map((domain) => `*://${domain}/*`),
        })),
    []
  );

  useLayoutEffect(() => {
    if (import.meta.env.VITE_WHISKER) return;
    /** Log Targets */
    customLogger("COOKIE TARGETS", targets);

    const listeners = targets.map(({ origin, urls }) => {
      /** Callback */
      const listener = (ev) => {
        ev.responseHeaders
          .filter((item) => item.name.toLowerCase() === "set-cookie")
          .forEach((header) => {
            const parsed = setCookie.parseString(header.value);
            const cookie = {
              url: origin,
              name: parsed.name,
              domain: parsed.domain,
              path: parsed.path,
              value: parsed.value,
              httpOnly: parsed.httpOnly,
              secure: true,
              sameSite: "no_restriction",
            };

            if (typeof parsed.maxAge !== "undefined") {
              cookie.expirationDate =
                Math.floor(Date.now() / 1000) + parsed.maxAge;
            } else if (parsed.expires instanceof Date) {
              cookie.expirationDate = Math.floor(
                parsed.expires.getTime() / 1000
              );
            }

            /** Log */
            customLogger("COOKIE", header, parsed, cookie);

            /** If expired, then remove */
            if (
              cookie.expirationDate &&
              cookie.expirationDate < Date.now() / 1000
            ) {
              chrome.cookies.remove({ url: origin, name: parsed.name });
            } else {
              chrome.cookies.set(cookie);
            }
          });
      };

      /** Register Callback */
      chrome?.webRequest?.onHeadersReceived?.addListener(listener, { urls }, [
        "responseHeaders",
        "extraHeaders",
      ]);

      return listener;
    });

    return () =>
      listeners.forEach((listener) =>
        chrome?.webRequest?.onHeadersReceived?.removeListener(listener)
      );
  }, [targets]);
}
