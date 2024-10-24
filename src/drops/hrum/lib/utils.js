import md5 from "md5";

export function getHrumHeaders(data, key) {
  const apiTime = Date.now() / 1000;
  const apiHash = md5(
    encodeURIComponent(`${apiTime}_${JSON.stringify(data || "")}`)
  );

  return {
    "Api-Key": key || "empty",
    "Api-Time": apiTime,
    "Api-Hash": apiHash,
    "Is-Beta-Server": null,
  };
}
