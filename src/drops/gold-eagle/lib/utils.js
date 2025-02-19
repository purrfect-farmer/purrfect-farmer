import forge from "node-forge";
import { Buffer } from "buffer";
import { HashAlgorithms, KeyEncodings } from "@otplib/core";
import { createDigest } from "@otplib/plugin-crypto-js";
import { decode } from "hi-base32";
import { findDropMainScript } from "@/lib/utils";
import { totp } from "otplib";

const INDEX_SCRIPT = "index-B6HNlJxk";
const SECRET = "FZYQHANLB3I2KAWEOKI4T2PVXHHZ4K5F";
const ENCRYPTION_ALGORITHM = "RSAES-PKCS1-V1_5";
const PEM =
  "-----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyH0A/d/2Dc1QGDCpVgD/ 8Xx1o3GHccjybtK3AM4Wv0faLZL6J1jDLGdmOEnE2+HkTuxTBSVBZT1a+8Iazxkd LqTihCZxGUxp6i9CZatICimC7LbdGJW++t+X9l7EH6uEBPuSjQcuNuaODQkefncW //rni5iksdd3pjQRLM+PVEMzPw+pvgfPfAn0fUDqer0itUJFQ5P0+tVaL/6AlcBY EqnirvIo8tfps/+9yGqc2znCVWwaR+1uCeVZ6gbt96XPVxaGf+hKn+TwiJo2sykH OGADDSK8sEWca7DqSQScGSTc5/DD2CeSK78pwlhYOQb6694PI0Cr5g+tpPm94gk/ nwIDAQAB -----END PUBLIC KEY-----";

/** Expose Buffer */
window.Buffer = window.Buffer || Buffer;

/** Update TOTP */
totp.options = {
  createDigest,
  encoding: KeyEncodings.HEX,
  digits: 6,
  step: 3,
  algorithm: HashAlgorithms.SHA256,
};

const secret = SECRET;
const bytes = decode.asBytes(secret);
const hex = Buffer.from(bytes).toString("hex");

export async function getGoldEagleGame() {
  if (getGoldEagleGame.DATA) return getGoldEagleGame.DATA;

  const url = "https://telegram.geagle.online";
  const script = await findDropMainScript(url, INDEX_SCRIPT);

  if (!script) return;

  const initialNonce = btoa(totp.generate(hex));
  const result = {
    initialNonce,
    secret,
    bytes,
    hex,
  };

  return (getGoldEagleGame.DATA = result);
}

export function calculateGoldEagleData(taps, currentNonce) {
  const nonce = currentNonce || btoa(totp.generate(hex));
  const input = {
    st: taps,
    ct: nonce,
  };
  const json = JSON.stringify(input);

  const buffer = Buffer.from(json, "utf8");
  const key = forge.pki.publicKeyFromPem(PEM);
  const data = key.encrypt(buffer.toString("binary"), ENCRYPTION_ALGORITHM);

  return Buffer.from(data, "binary").toString("base64");
}
