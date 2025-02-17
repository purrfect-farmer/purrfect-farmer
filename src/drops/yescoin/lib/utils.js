import { getDropMainScript } from "@/lib/utils";

export async function getSignInKey() {
  if (getSignInKey.DATA) return getSignInKey.DATA;

  const scriptResponse = await getDropMainScript("https://www.yescoin.fun");

  const match = scriptResponse.match(/"([^"]+)"[^"]+\.signInType/);

  return (getSignInKey.DATA = match[1]);
}
