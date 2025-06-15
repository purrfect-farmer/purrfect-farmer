const getLocalStorageKey = () =>
  "__telegram_webview_proxy_" + window.Telegram.WebApp.initDataUnsafe.user.id;

const getStorage = () =>
  JSON.parse(localStorage.getItem(getLocalStorageKey()) || "{}");

const saveStorage = (data) =>
  localStorage.setItem(getLocalStorageKey(), JSON.stringify(data));

function postEvent(eventType, eventData) {
  const sendEvent = (eventType, eventData) => {
    window.Telegram.WebView.receiveEvent(eventType, eventData);
  };

  switch (eventType) {
    case "web_app_invoke_custom_method":
      const respond = (result) => {
        sendEvent("custom_method_invoked", {
          ["req_id"]: eventData["req_id"],
          result,
        });
      };

      switch (eventData.method) {
        case "getStorageKeys":
          return respond(Object.keys(getStorage()));

        case "getStorageValues":
          return respond(
            Object.fromEntries(
              Object.entries(getStorage()).filter(([k]) =>
                eventData.params.keys.includes(k)
              )
            )
          );

        case "saveStorageValue":
          saveStorage({
            ...getStorage(),
            [eventData.params.key]: eventData.params.value,
          });
          return respond(true);

        case "deleteStorageValues":
          saveStorage(
            Object.fromEntries(
              Object.entries(getStorage()).filter(
                ([k]) => eventData.params.keys.includes(k) === false
              )
            )
          );

          return respond(true);
      }
      break;
  }

  return window.parent.postMessage(
    JSON.stringify({ eventType: eventType, eventData: eventData }),
    "*"
  );
}

window.TelegramWebviewProxy = {
  postEvent(type, data) {
    const eventData = data ? JSON.parse(data) : null;
    return postEvent(type, eventData);
  },
};
