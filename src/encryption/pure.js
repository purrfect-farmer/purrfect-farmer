export function encryptData(data) {
  return JSON.stringify(data);
}

export function decryptData(data) {
  return typeof data !== "undefined" ? JSON.parse(data) : null;
}
