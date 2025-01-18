import { getDropMainScript } from "@/lib/utils";

export async function getGoldEagleGame() {
  if (getGoldEagleGame.DATA) return getGoldEagleGame.DATA;
  const url = "https://telegram.geagle.online";
  const scriptResponse = await getDropMainScript(url);

  const tapSecret = scriptResponse.match(/TAP_SECRET="([^"]+)"/);

  if (tapSecret) {
    const result = {
      tapSecret: tapSecret[1],
    };

    return (getGoldEagleGame.DATA = result);
  }
}
