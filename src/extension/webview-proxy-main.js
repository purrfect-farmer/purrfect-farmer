const originalPostMessage = window.parent.postMessage.bind(window.parent);

const getStorage = () =>
  JSON.parse(localStorage.getItem("__telegram_webview_proxy")) || {};

const saveStorage = (data) =>
  localStorage.setItem("__telegram_webview_proxy", JSON.stringify(data));

function postEvent(eventType, eventData) {
  const sendEvent = (eventType, eventData) => {
    window.Telegram.WebView.receiveEvent(eventType, eventData);
  };

  switch (eventType) {
    case "web_app_request_viewport":
      return sendEvent("viewport_changed", {
        width: window.innerWidth,
        height: window.innerHeight,
      });

    case "web_app_request_safe_area":
    case "web_app_request_content_safe_area":
      return sendEvent(
        eventType === "web_app_request_safe_area"
          ? "safe_area_changed"
          : "content_safe_area_changed",
        {
          top: 0,
          botttom: 0,
          left: 0,
          right: 0,
        }
      );

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

  return originalPostMessage(
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
