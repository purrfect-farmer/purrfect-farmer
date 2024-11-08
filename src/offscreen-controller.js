function openTelegramWeb() {
  /** Remove Previous Iframes */
  document.querySelectorAll("iframe").forEach((element) => element.remove());

  /** Create a new Iframe */
  const iframe = document.createElement("iframe");
  iframe.src = `https://web.telegram.org/k/#${
    import.meta.env.VITE_APP_BOT_USERNAME
  }`;

  iframe.style.display = "block";
  iframe.style.width = "414px";
  iframe.style.height = "896px";

  /** Append Iframe */
  document.body.appendChild(iframe);
}

const port = chrome.runtime.connect(chrome.runtime.id, {
  name: "offscreen",
});

/** Listen for Port Message */
port.onMessage.addListener(async (message) => {
  const { id, action } = message;
  switch (action) {
    case "open-telegram-web":
      await openTelegramWeb();
      port.postMessage({
        id,
        data: true,
      });
      break;
  }
});
