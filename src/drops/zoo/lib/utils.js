import md5 from "md5";

export function getZooHeaders(data, key) {
  const apiTime = Math.floor(Date.now() / 1000);
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
