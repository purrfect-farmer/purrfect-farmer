import sha256 from "crypto-js/sha256";
import { customLogger, uuid } from "@/lib/utils";

export async function getSpaceAdventureCookies() {
  if (import.meta.env.VITE_WHISKER) {
    return window.electron.ipcRenderer.invoke(
      "get-session-cookie",
      window.WHISKER_PARTITION,
      {
        domain: "space-adventure.online",
      }
    );
  } else {
    return chrome.cookies.getAll({ domain: "space-adventure.online" });
  }
}

export async function getSpaceAdventureHeaders({
  authId = "",
  token = "",
} = {}) {
  const cookies = await getSpaceAdventureCookies();
  console.log(cookies);
  const xsrf = decodeURIComponent(
    cookies.find((item) => item.name === "XSRF-TOKEN")?.value || ""
  );
  const headers = {
    "x-xsrf-token": xsrf,
  };

  if (authId) {
    headers["x-auth-id"] = authId;
  }

  if (token) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = uuid() + "-" + timestamp;
    const sign = await getXsrfSign(xsrf, timestamp);
    const signature = sha256(
      `${timestamp}:${token}:${nonce}:${timestamp}:${sign}`
    ).toString();

    headers["x-timestamp"] = timestamp;
    headers["x-nonce"] = nonce;
    headers["x-xsrf-sign"] = sign;
    headers["x-signature"] = signature;
  }

  customLogger("SPACE-ADVENTURE HEADERS", headers);

  return headers;
}

/**
 * Get XSRF Sign
 * @param {string} xsrf XSRF Token
 * @param {number} timestamp Timestamp
 * @returns {string}
 */
export async function getXsrfSign(xsrf, timestamp) {
  const half = Math.floor(xsrf.length / 2);
  const first = xsrf.slice(0, half);
  const second = xsrf.slice(half);

  return sha256(`${first}${timestamp}${second}`).toString();
}
