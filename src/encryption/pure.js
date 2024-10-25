export function encryptData(data) {
  return JSON.stringify(data);
}

export function decryptData(data) {
  return JSON.parse(data);
}
