import { Centrifuge } from "centrifuge/build/protobuf";
import { decompress } from "fflate";

import { getCoords } from "./lib/utils";

/** Polyfill Local Storage */
Object.defineProperty(window, "localStorage", {
  get: () => ({
    getItem() {},
    setItem() {},
  }),
  configurable: true,
});

let STARTED = false;
let centrifuge;

const publicationHandler = (message) => {
  if (message.channel === "event:message") {
    const events = JSON.parse(new TextDecoder().decode(message.data));
    let pixelUpdates = [];

    for (let event of events) {
      if (event.type === "Dynamite") {
        const SIZE = 5;
        const HALF = Math.floor(SIZE / 2);

        const position = event.pixel - 1;
        const { x, y } = getCoords(position, {
          x: 0,
          y: 0,
          size: 1000,
        });

        const startX = x - HALF;
        const startY = y - HALF;

        for (let i = 0; i < SIZE; i++) {
          for (let j = 0; j < SIZE; j++) {
            const currentX = startX + i;

            const currentY = startY + j;

            let offset = currentY * 1000 + currentX;
            let pixelId = offset + 1;

            pixelUpdates.push([pixelId, null]);
          }
        }

        window.parent.postMessage(
          {
            action: "update-world-pixels",
            data: pixelUpdates,
          },
          "*"
        );
      }
    }
  } else {
    decompress(new Uint8Array(message.data), (error, result) => {
      if (error) {
        return;
      }

      const data = JSON.parse(new TextDecoder().decode(result));

      if (message.channel === "pixel:message") {
        let pixelUpdates = [];

        for (let key in data) {
          const hex = `#${key.replace("#", "")}`;
          data[key].forEach((pixel) => {
            pixelUpdates.push([pixel, hex]);
          });
        }

        window.parent.postMessage(
          {
            action: "update-world-pixels",
            data: pixelUpdates,
          },
          "*"
        );
      }
    });
  }
};

const connectSocket = (token) => {
  centrifuge = new Centrifuge("wss://notpx.app/connection/websocket", {
    token,
  });

  /** Connected */
  centrifuge.on("connected", () => {
    window.parent.postMessage(
      {
        action: "set-socket-status",
        data: true,
      },
      "*"
    );
  });

  /** Add Event Listener for Disconnected */
  centrifuge.on("disconnected", (ev) => {
    window.parent.postMessage(
      {
        action: "set-socket-status",
        data: false,
      },
      "*"
    );
  });

  /** Add Event Listener for Publication */
  centrifuge.on("publication", publicationHandler);

  /** Connect */
  centrifuge.connect();

  STARTED = true;
};

window.addEventListener("message", (ev) => {
  const { action, data } = ev.data;

  if (action === "start-socket" && !STARTED) {
    connectSocket(data.token);
  }
});
