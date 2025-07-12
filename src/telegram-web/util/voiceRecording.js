import { requestMeasure } from "../lib/fasterdom/fasterdom";

const encoderPath = new URL(
  "opus-recorder/dist/encoderWorker.min.js",
  import.meta.url
).href;

const MIN_RECORDING_TIME = 1000;
const POLYFILL_OPTIONS = { encoderPath, reuseWorker: true };
const BLOB_PARAMS = { type: "audio/ogg" };
const FFT_SIZE = 64;
const MIN_VOLUME = 0.1;
let opusRecorderPromise;
let OpusRecorder;
let mediaRecorder;
export async function init() {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (!opusRecorderPromise) {
    opusRecorderPromise = import("opus-recorder");
    OpusRecorder = (await opusRecorderPromise).default;
    mediaRecorder = new OpusRecorder(POLYFILL_OPTIONS);
  }
  return opusRecorderPromise;
}
export async function start(analyzerCallback) {
  await startMediaRecorder();
  const startedAt = Date.now();
  let pausedAt;
  const chunks = [];
  const waveform = [];
  mediaRecorder.ondataavailable = (typedArray) => {
    chunks.push(typedArray);
  };
  const releaseAnalyzer = subscribeToAnalyzer(mediaRecorder, (volume) => {
    waveform.push(volume * 255);
    analyzerCallback(volume);
  });
  return {
    stop: () =>
      new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          resolve({
            blob: new Blob(chunks, BLOB_PARAMS),
            duration: Math.round(((pausedAt || Date.now()) - startedAt) / 1000),
            waveform,
          });
        };
        mediaRecorder.onerror = reject;
        const delayStop = Math.max(
          0,
          startedAt + MIN_RECORDING_TIME - Date.now()
        );
        setTimeout(() => {
          mediaRecorder.stop();
          releaseAnalyzer();
        }, delayStop);
      }),
    pause: () => {
      const delayStop = Math.max(
        0,
        startedAt + MIN_RECORDING_TIME - Date.now()
      );
      setTimeout(() => {
        mediaRecorder.pause();
        pausedAt = Date.now();
        releaseAnalyzer();
      }, delayStop);
    },
  };
}
async function startMediaRecorder() {
  await init();
  mediaRecorder.start();
}
function subscribeToAnalyzer(recorder, cb) {
  const source = recorder.sourceNode;
  const analyser = source.context.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  source.connect(analyser);
  const dataLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(dataLength);
  let isDestroyed = false;
  function tick() {
    if (isDestroyed) {
      return;
    }
    analyser.getByteFrequencyData(dataArray);
    const sum = dataArray.reduce((acc, current) => acc + current, 0);
    const mean = sum / dataLength;
    const volume = mean / 255;
    cb(volume < MIN_VOLUME ? 0 : volume);
    requestMeasure(tick);
  }
  tick();
  return () => {
    isDestroyed = true;
  };
}
