/** Exit shortly so the reply goes out first, letting the process manager restart the server */
export function restartSoon() {
  setTimeout(() => process.exit(0), 1000);
}
