import storage from "./storage";
import { sharedStorageKey } from "./storageKeys";

/** Where the hosts of opened mini-apps are kept */
export const MINI_APP_HOSTS_KEY = sharedStorageKey("mini-app-hosts");

/** How many recent mini-app hosts get the phone's headers */
const MAX_MINI_APP_HOSTS = 100;

/** The hostnames of recently opened mini-apps, newest first, without the ports older entries kept */
export async function getMiniAppHosts() {
  const hosts = await storage.get(MINI_APP_HOSTS_KEY);

  if (!Array.isArray(hosts)) return [];

  return [...new Set(hosts.map((host) => host.replace(/:\d+$/, "")))];
}

/** Remember a mini-app's host so its requests carry the phone's headers */
export async function rememberMiniAppHost(host) {
  const hosts = await getMiniAppHosts();

  if (hosts.includes(host)) return;

  await storage.set(
    MINI_APP_HOSTS_KEY,
    [host, ...hosts].slice(0, MAX_MINI_APP_HOSTS),
  );
}
