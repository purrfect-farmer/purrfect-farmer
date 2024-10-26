import { fetchContent } from "@/lib/utils";

export async function getTomarketGame() {
  if (getTomarketGame.DATA) return getTomarketGame.DATA;
  const url = "https://mini-app.tomarket.ai";
  const htmlResponse = await fetchContent(url);

  const parser = new DOMParser();
  const html = parser.parseFromString(htmlResponse, "text/html");

  const links = html.querySelectorAll("link");

  const trackScriptPreload = Array.prototype.find.call(
    links,
    (link) => link.rel === "modulepreload" && link.href.includes("track")
  );

  if (!trackScriptPreload) return;

  const scriptUrl = new URL(trackScriptPreload.getAttribute("href"), url);
  const scriptResponse = await fetchContent(scriptUrl);

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
