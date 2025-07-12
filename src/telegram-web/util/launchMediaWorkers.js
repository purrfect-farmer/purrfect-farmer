import { IS_TEST } from "../config";
import { createConnector } from "./PostMessageConnector";
export const MAX_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 4);
let instances;
export default function launchMediaWorkers() {
  if (IS_TEST) return [];
  if (!instances) {
    instances = new Array(MAX_WORKERS).fill(undefined).map(() => {
      const worker = new Worker(
        new URL("../lib/mediaWorker/index.worker.js", import.meta.url),
        { type: "module" }
      );
      const connector = createConnector(worker, undefined, "media");
      return { worker, connector };
    });
  }
  return instances;
}
export function requestMediaWorker(payload, index) {
  return launchMediaWorkers()[index].connector.request(payload);
}
