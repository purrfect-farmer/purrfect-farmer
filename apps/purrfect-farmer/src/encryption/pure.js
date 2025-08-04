export function encryptData(data) {
  return JSON.stringify(data);
}

export function decryptData(data) {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
