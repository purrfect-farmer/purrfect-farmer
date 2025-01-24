import { decryptData, encryptData } from "./encryption/pure";

export { encryptData, decryptData };

export const core = {
  fetch: window.fetch.bind(window),
  matchMedia: window.matchMedia.bind(window),
  XMLHttpRequest: window.XMLHttpRequest.bind(window),
  postMessage: window.postMessage.bind(window),
  Promise: {
    race: Promise.race.bind(Promise),
  },
};
