if (import.meta.env.VITE_BRIDGE) {
  /** Check if is externally connectable */
  const isExternallyConnectable = () => {
    const manifest = chrome.runtime.getManifest();
    const patterns = manifest["externally_connectable"]["matches"].map(
      (glob) =>
        new RegExp(
          "^" +
            glob
              .replace(/\./g, "\\.")
              .replace(/\*/g, ".*")
              .replace(/\//g, "\\/") +
            "$"
        )
    );

    const url = new URL(window.location.href);
    const strippedUrl = `${url.protocol}//${url.hostname}${url.pathname}`;

    return patterns.some((pattern) => {
      return pattern.test(strippedUrl);
    });
  };

  /** Post Bridge ID */
  window.postMessage(
    {
      bridgeId: chrome.runtime.id,
      expose: isExternallyConnectable(),
    },
    "*"
  );
}
