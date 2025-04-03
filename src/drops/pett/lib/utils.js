export function getPettHeaders(userId, hash = "") {
  return {
    "X-Masterhash": hash,
    "X-Player-Id": userId,
  };
}
