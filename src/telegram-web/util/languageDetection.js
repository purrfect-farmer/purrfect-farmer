import Deferred from "./Deferred";
import { IS_TRANSLATION_SUPPORTED } from "./browser/windowEnvironment";
import { createConnector } from "./PostMessageConnector";
const WORKER_INIT_DELAY = 4000;
const DEFAULT_THRESHOLD = 0.2;
const DEFAULT_LABELS_COUNT = 5;
let worker;
const initializationDeferred = new Deferred();
if (IS_TRANSLATION_SUPPORTED) {
  setTimeout(initWorker, WORKER_INIT_DELAY);
}
function initWorker() {
  if (!worker) {
    worker = createConnector(
      new Worker(
        new URL("../lib/fasttextweb/fasttext.worker.js", import.meta.url),
        { type: "module" }
      )
    );
    initializationDeferred.resolve();
  }
}
export async function detectLanguage(text, threshold = DEFAULT_THRESHOLD) {
  if (!worker) await initializationDeferred.promise;
  const result = await worker.request({
    name: "detectLanguage",
    args: [text, threshold],
  });
  return result;
}
export async function detectLanguageProbability(
  text,
  labelsCount = DEFAULT_LABELS_COUNT,
  threshold = DEFAULT_THRESHOLD
) {
  if (!worker) await initializationDeferred.promise;
  const result = await worker.request({
    name: "detectLanguageProbability",
    args: [text, labelsCount, threshold],
  });
  return result;
}
