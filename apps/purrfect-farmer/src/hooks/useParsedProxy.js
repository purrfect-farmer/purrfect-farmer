import { useMemo } from "react";

export default function useParsedProxy(proxy) {
  return useMemo(() => {
    if (!proxy) return null;
    const [user, server] = proxy.split("@");
    const [proxyHost, proxyPort] = server.split(":");
    const [proxyUsername, proxyPassword] = user.split(":");

    return {
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    };
  }, [proxy]);
}
