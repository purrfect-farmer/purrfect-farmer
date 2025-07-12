import fasttextInitializer from "./fasttext-wasm.cjs";
import fasttextWasmPath from "./fasttext-wasm.wasm?url";
import { DEBUG } from "../../config";
import { createWorkerInterface } from "../../util/createPostMessageInterface";
const LABEL_PREFIX = "__label__";
// Since webpack will change the name and potentially the path of the
// `.wasm` file, we have to provide a `locateFile()` hook to redirect
// to the appropriate URL.
// More details: https://kripken.github.io/emscripten-site/docs/api_reference/module.html
let fastTextInstance;
const fastTextPromise = fasttextInitializer({
  locateFile: (path, prefix) => {
    if (path.endsWith(".wasm")) {
      return fasttextWasmPath;
    }
    return prefix + path;
  },
}).then((fastText) => {
  fastTextInstance = fastText;
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log("[FASTTEXT] Worker ready");
  }
});
function parseLabel(label) {
  return label.split("\n")[0].replace(LABEL_PREFIX, "").trim();
}
function parseLabelsWithProbabilities(labels) {
  return labels
    .trim()
    .split("\n")
    .map((labelWithProb) => {
      const [label, prob] = labelWithProb.split(" ");
      return {
        label: parseLabel(label),
        prob: parseFloat(prob),
      };
    });
}
export async function detectLanguage(text, threshold) {
  if (!fastTextInstance) await fastTextPromise;
  const label = await fastTextInstance.makePrediction(
    "predict",
    text,
    "1",
    threshold.toString()
  );
  if (!label.length) return undefined;
  return parseLabel(label);
}
export async function detectLanguageProbability(text, labelsCount, threshold) {
  if (!fastTextInstance) await fastTextPromise;
  const labels = await fastTextInstance.makePrediction(
    "predict-prob",
    text,
    labelsCount.toString(),
    threshold.toString()
  );
  if (!labels.length) return undefined;
  return parseLabelsWithProbabilities(labels);
}
const api = {
  detectLanguage,
  detectLanguageProbability,
};
createWorkerInterface(api);
