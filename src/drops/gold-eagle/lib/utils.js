import forge from "node-forge";
import { TOTP } from "totp-generator";
import { fetchContent, findDropMainScript } from "@/lib/utils";

const SECRET = "FZYQHANLB3I2KAWEOKI4T2PVXHHZ4K5F";
const ALGORITHM = "SHA-256";
const ENCRYPTION_ALGORITHM = "RSAES-PKCS1-V1_5";
const PUBLIC_KEY =
  "-----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyH0A/d/2Dc1QGDCpVgD/ 8Xx1o3GHccjybtK3AM4Wv0faLZL6J1jDLGdmOEnE2+HkTuxTBSVBZT1a+8Iazxkd LqTihCZxGUxp6i9CZatICimC7LbdGJW++t+X9l7EH6uEBPuSjQcuNuaODQkefncW //rni5iksdd3pjQRLM+PVEMzPw+pvgfPfAn0fUDqer0itUJFQ5P0+tVaL/6AlcBY EqnirvIo8tfps/+9yGqc2znCVWwaR+1uCeVZ6gbt96XPVxaGf+hKn+TwiJo2sykH OGADDSK8sEWca7DqSQScGSTc5/DD2CeSK78pwlhYOQb6694PI0Cr5g+tpPm94gk/ nwIDAQAB -----END PUBLIC KEY-----";

/** Encryption Instance */
const ENCRYPTION = forge.pki.publicKeyFromPem(PUBLIC_KEY);

export async function getGoldEagleGame() {
  if (getGoldEagleGame.DATA) return getGoldEagleGame.DATA;

  const config = await fetchContent(import.meta.env.VITE_APP_FARMER_CONFIG_URL);
  const indexScript = config["gold-eagle"]["index"];

  const url = "https://telegram.geagle.online";
  const script = await findDropMainScript(url, indexScript);

  if (!script) return;

  const initialNonce = generateNonce();
  const result = {
    initialNonce,
    secret: SECRET,
  };

  return (getGoldEagleGame.DATA = result);
}

export function generateTOTP() {
  return TOTP.generate(SECRET, {
    algorithm: ALGORITHM,
    digits: 6,
    period: 3,
  });
}

export function generateNonce() {
  return btoa(generateTOTP().otp);
}

export function calculateGoldEagleData(taps, currentNonce) {
  const nonce = currentNonce || generateNonce();
  const input = {
    st: taps,
    ct: nonce,
  };
  const json = JSON.stringify(input);
  const data = ENCRYPTION.encrypt(json, ENCRYPTION_ALGORITHM);
  const result = btoa(data);

  return result;
}
