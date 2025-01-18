import { Buffer } from "buffer";
import { HashAlgorithms, KeyEncodings } from "@otplib/core";
import { createDigest } from "@otplib/plugin-crypto-js";
import { decode } from "hi-base32";
import { getDropMainScript } from "@/lib/utils";
import { totp } from "otplib";

window.Buffer = window.Buffer || Buffer;
totp.options = {
  createDigest,
  encoding: KeyEncodings.HEX,
  digits: 6,
  step: 2,
  algorithm: HashAlgorithms.SHA1,
};

export async function getGoldEagleGame() {
  if (getGoldEagleGame.DATA) return getGoldEagleGame.DATA;
  const url = "https://telegram.geagle.online";
  const scriptResponse = await getDropMainScript(url);

  const match = scriptResponse.match(/TAP_SECRET="([^"]+)"/);
  if (match) {
    const secret = match[1];
    const bytes = decode.asBytes(secret);
    const hex = Buffer.from(bytes).toString("hex");
    const initialNonce = btoa(totp.generate(hex));
    const result = {
      initialNonce,
      secret,
      bytes,
      hex,
    };

    return (getGoldEagleGame.DATA = result);
  }
}
