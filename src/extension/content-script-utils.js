import { decryptData, encryptData } from "@/encryption/pure";

export { encryptData, decryptData };

export const core = {
  open: window.open.bind(window),
  fetch: window.fetch.bind(window),
  matchMedia: window.matchMedia.bind(window),
  XMLHttpRequest: window.XMLHttpRequest.bind(window),
  postMessage: window.postMessage.bind(window),
  document: {
    createElement: document.createElement.bind(document),
  },
  Promise: {
    race: Promise.race.bind(Promise),
  },
};
