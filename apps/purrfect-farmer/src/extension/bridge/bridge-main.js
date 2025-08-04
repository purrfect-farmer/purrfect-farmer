if (import.meta.env.VITE_BRIDGE) {
  /**
   * @param {MessageEvent} ev
   */
  const handleBridge = (ev) => {
    if (
      ev.source === window &&
      typeof ev.data === "object" &&
      ev.data?.bridgeId
    ) {
      /** Remove Listener */
      window.removeEventListener("message", handleBridge);

      /** Expose */
      if (ev.data.expose) {
        window.BRIDGE_ID = ev.data?.bridgeId;
      }
    }
  };

  /** Listen for Bridge */
  window.addEventListener("message", handleBridge);
}
