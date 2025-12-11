export { default as md5 } from "md5";
export { sha256 } from "js-sha256";

import { sha256 } from "js-sha256";
export function sha256Hmac(key, data) {
  return sha256.hmac(key, data);
}
