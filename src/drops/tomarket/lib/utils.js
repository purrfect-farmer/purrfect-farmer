import { getDropMainScript } from "@/lib/utils";

export async function getTomarketGame() {
  if (getTomarketGame.DATA) return getTomarketGame.DATA;
  const scriptResponse = await getDropMainScript(
    "https://mini-app.tomarket.ai"
  );

  const daily = scriptResponse.match(/daily:"([^"]+)"/);
  const drop = scriptResponse.match(/drop:"([^"]+)"/);
  const farm = scriptResponse.match(/farm:"([^"]+)"/);

  if ([daily, drop, farm].every(Boolean)) {
    const result = {
      daily: daily[1],
      drop: drop[1],
      farm: farm[1],
    };

    return (getTomarketGame.DATA = result);
  }
}
