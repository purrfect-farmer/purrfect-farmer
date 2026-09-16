/** Matches the token query parameter of a Telegram login link */
const TOKEN_PARAM_PATTERN = /[?&]token=([A-Za-z0-9\-_+/=]+)/;

/** Matches a bare base64url token */
const BARE_TOKEN_PATTERN = /^[A-Za-z0-9\-_+/=]+$/;

/** Decode a base64url (or plain base64) string into a Buffer */
function decodeBase64UrlToken(token) {
  const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return Buffer.from(padded, "base64");
}

/** Parse a tg:// link, an https login link or a bare token into its raw bytes */
export function parseLoginToken(input) {
  const value = (input || "").trim();

  if (!value) {
    throw new Error("Nothing to authorize. Scan or paste a login link.");
  }

  const linkMatch = value.match(TOKEN_PARAM_PATTERN);
  const token = linkMatch ? linkMatch[1] : value;

  if (!linkMatch && !BARE_TOKEN_PATTERN.test(token)) {
    throw new Error("This is not a Telegram login link.");
  }

  const buffer = decodeBase64UrlToken(token);

  if (buffer.length === 0) {
    throw new Error("The login token is empty.");
  }

  return buffer;
}

/** Short hex fingerprint, shown so the user can tell two QR codes apart */
export function describeLoginToken(token) {
  return token.toString("hex").slice(0, 12).toUpperCase().match(/.{1,4}/g).join(" ");
}
