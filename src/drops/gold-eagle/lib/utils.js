import { fetchContent, findDropMainScript } from "@/lib/utils";

export async function getGoldEagleGame() {
  if (getGoldEagleGame.DATA) return getGoldEagleGame.DATA;

  const config = await fetchContent(import.meta.env.VITE_APP_FARMER_CONFIG_URL);
  const indexScript = config["gold-eagle"]["index"];

  const url = "https://telegram.geagle.online";
  const script = await findDropMainScript(url, indexScript);

  if (!script) return;

  const result = {
    checkScript: true,
  };

  return (getGoldEagleGame.DATA = result);
}
