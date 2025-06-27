export function getTsubasaHeaders(userId, hash = "") {
  return {
    "X-Masterhash": hash,
    "X-Player-Id": userId,
  };
}
