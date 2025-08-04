import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

const SECRET_PHRASE = __ENCRYPTION_KEY__;

export function encryptData(data) {
  return AES.encrypt(JSON.stringify(data), SECRET_PHRASE).toString();
}

export function decryptData(cipher) {
  const bytes = AES.decrypt(cipher, SECRET_PHRASE).toString(Utf8);

  return JSON.parse(bytes);
}
