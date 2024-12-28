export function getBattleBullsHeaders(userId, hash = "") {
  return {
    "X-Masterhash": hash,
    "X-Player-Id": userId,
  };
}
