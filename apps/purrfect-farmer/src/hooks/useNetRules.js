import storage from "@/lib/storage";
import updateNetRules from "@/lib/updateNetRules";
import { MINI_APP_HOSTS_KEY } from "@/lib/miniAppHosts";
import { useLayoutEffect } from "react";

/** Keep the net rules applied, and current with the opened mini-apps */
export default function useNetRules() {
  useLayoutEffect(() => {
    updateNetRules();

    storage.on(MINI_APP_HOSTS_KEY, updateNetRules);

    return () => storage.off(MINI_APP_HOSTS_KEY, updateNetRules);
  }, []);
}
