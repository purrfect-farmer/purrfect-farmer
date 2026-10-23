/** Turn a `user:pass@ip:port` proxy into gramjs SOCKS5 options */
export function parseProxy(proxy) {
  if (!proxy) return null;

  const [creds, hostPort] = proxy.split("@");
  const [username, password] = creds.split(":");
  const [ip, port] = hostPort.split(":");

  return {
    ip,
    username,
    password,
    port: parseInt(port, 10),
    MTProxy: false,
    socksType: 5,
    timeout: 2,
  };
}
