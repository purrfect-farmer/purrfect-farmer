import { getDropMainScript } from "@/lib/utils";

export async function getTomarketGame() {
  if (getTomarketGame.DATA) return getTomarketGame.DATA;
  const url = "https://mini-app.tomarket.ai";
  const scriptResponse = await getDropMainScript(url);

  const daily = scriptResponse.match(
    /daily:"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/
  );
  const drop = scriptResponse.match(
    /drop:"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/
  );
  const farm = scriptResponse.match(
    /farm:"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/
  );

  if ([daily, drop, farm].every(Boolean)) {
    const result = {
      daily: daily[1],
      drop: drop[1],
      farm: farm[1],
    };

    return (getTomarketGame.DATA = result);
  }
}
