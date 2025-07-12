import Deferred from "../../../util/Deferred";
import generateUniqueId from "../../../util/generateUniqueId";
import {
  ACCOUNT_SLOT,
  DATA_BROADCAST_CHANNEL_NAME,
} from "../../../util/multiaccount";
import { DEBUG, IGNORE_UNHANDLED_ERRORS } from "../../../config";
import {
  getCurrentTabId,
  subscribeToMasterChange,
} from "../../../util/establishMultitabRole";
import { logDebugMessage } from "../../../util/debugConsole";
import { pause, throttleWithTickEnd } from "../../../util/schedulers";
const HEALTH_CHECK_TIMEOUT = 150;
const HEALTH_CHECK_MIN_DELAY = 5 * 1000; // 5 sec
const NO_QUEUE_BEFORE_INIT = new Set(["destroy"]);
let worker;
const requestStates = new Map();
const requestStatesByCallback = new Map();
let pendingPayloads = [];
const savedLocalDb = {
  chats: {},
  users: {},
  documents: {},
  stickerSets: {},
  photos: {},
  webDocuments: {},
  commonBoxState: {},
  channelPtsById: {},
};
let isMasterTab = true;
subscribeToMasterChange((isMasterTabNew) => {
  isMasterTab = isMasterTabNew;
});
const channel = new BroadcastChannel(DATA_BROADCAST_CHANNEL_NAME);
const postMessagesOnTickEnd = throttleWithTickEnd(() => {
  const payloads = pendingPayloads;
  pendingPayloads = [];
  worker?.postMessage({ payloads });
});
function postMessageOnTickEnd(payload) {
  pendingPayloads.push(payload);
  postMessagesOnTickEnd();
}
export function initApiOnMasterTab(initialArgs) {
  channel.postMessage({
    type: "initApi",
    token: getCurrentTabId(),
    initialArgs,
  });
}
let updateCallback;
let localApiRequestsQueue = [];
let apiRequestsQueue = [];
let isInited = false;
export function initApi(onUpdate, initialArgs) {
  updateCallback = onUpdate;
  if (!isMasterTab) {
    initApiOnMasterTab(initialArgs);
    return Promise.resolve();
  }
  if (!worker) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log(">>> START LOAD WORKER");
    }
    const params = new URLSearchParams();
    if (ACCOUNT_SLOT) {
      params.set("account", String(ACCOUNT_SLOT));
    }
    worker = new Worker(new URL("./worker.js", import.meta.url), {
      name: params.toString(),
      type: "module",
    });
    subscribeToWorker(onUpdate);
    if (initialArgs.platform === "iOS") {
      setupIosHealthCheck();
    }
  }
  return makeRequest({
    type: "initApi",
    args: [initialArgs, savedLocalDb],
  }).then(() => {
    isInited = true;
    apiRequestsQueue.forEach((request) => {
      callApi(request.fnName, ...request.args)
        .then(request.deferred.resolve)
        .catch(request.deferred.reject);
    });
    apiRequestsQueue = [];
    localApiRequestsQueue.forEach((request) => {
      callApiLocal(request.fnName, ...request.args)
        .then(request.deferred.resolve)
        .catch(request.deferred.reject);
    });
    localApiRequestsQueue = [];
  });
}
export function updateLocalDb(name, prop, value) {
  savedLocalDb[name][prop] = value;
}
export function updateFullLocalDb(initial) {
  Object.assign(savedLocalDb, initial);
}
export function callApiOnMasterTab(payload) {
  channel.postMessage({
    type: "callApi",
    token: getCurrentTabId(),
    ...payload,
  });
}
export function setShouldEnableDebugLog(value) {
  return makeRequest({
    type: "toggleDebugMode",
    isEnabled: value,
  });
}
/*
 * Call a worker method on this tab's worker, without transferring to master tab
 * Mostly needed to disconnect worker when re-electing master
 */
export function callApiLocal(fnName, ...args) {
  if (!isInited) {
    if (NO_QUEUE_BEFORE_INIT.has(fnName)) {
      return Promise.resolve(undefined);
    }
    const deferred = new Deferred();
    localApiRequestsQueue.push({ fnName, args, deferred });
    return deferred.promise;
  }
  const promise = makeRequest({
    type: "callMethod",
    name: fnName,
    args,
  });
  // Some TypeScript magic to make sure `VirtualClass` is never returned from any method
  if (DEBUG) {
    (async () => {
      try {
        // Unwrap all chained promises
        const response = await promise;
        // Make sure responses do not include `VirtualClass` instances
        const allowedResponse = response;
        // Suppress "unused variable" constraint
        void allowedResponse;
      } catch (err) {
        // Do noting
      }
    })();
  }
  return promise;
}
export function callApi(fnName, ...args) {
  if (!isInited && isMasterTab) {
    if (NO_QUEUE_BEFORE_INIT.has(fnName)) {
      return Promise.resolve(undefined);
    }
    const deferred = new Deferred();
    apiRequestsQueue.push({ fnName, args, deferred });
    return deferred.promise;
  }
  const promise = isMasterTab
    ? makeRequest({
        type: "callMethod",
        name: fnName,
        args,
      })
    : makeRequestToMaster({
        name: fnName,
        args,
      });
  // Some TypeScript magic to make sure `VirtualClass` is never returned from any method
  if (DEBUG) {
    (async () => {
      try {
        // Unwrap all chained promises
        const response = await promise;
        // Make sure responses do not include `VirtualClass` instances
        const allowedResponse = response;
        // Suppress "unused variable" constraint
        void allowedResponse;
      } catch (err) {
        // Do noting
      }
    })();
  }
  return promise;
}
export function cancelApiProgress(progressCallback) {
  progressCallback.isCanceled = true;
  const { messageId } = requestStatesByCallback.get(progressCallback) || {};
  if (!messageId) {
    return;
  }
  if (isMasterTab) {
    cancelApiProgressMaster(messageId);
  } else {
    channel.postMessage({
      type: "cancelApiProgress",
      token: getCurrentTabId(),
      messageId,
    });
  }
}
export function cancelApiProgressMaster(messageId) {
  postMessageOnTickEnd({
    type: "cancelProgress",
    messageId,
  });
}
function subscribeToWorker(onUpdate) {
  worker?.addEventListener("message", ({ data }) => {
    data?.payloads.forEach((payload) => {
      if (payload.type === "updates") {
        let DEBUG_startAt;
        if (DEBUG) {
          DEBUG_startAt = performance.now();
        }
        payload.updates.forEach(onUpdate);
        if (DEBUG) {
          const duration = performance.now() - DEBUG_startAt;
          if (duration > 5) {
            // eslint-disable-next-line no-console
            console.warn(
              `[API] Slow updates processing: ${payload.updates.length} updates in ${duration} ms`
            );
          }
        }
      } else if (payload.type === "methodResponse") {
        handleMethodResponse(payload);
      } else if (payload.type === "methodCallback") {
        handleMethodCallback(payload);
      } else if (payload.type === "unhandledError") {
        const message = payload.error?.message;
        if (message && IGNORE_UNHANDLED_ERRORS.has(message)) return;
        throw new Error(message);
      } else if (payload.type === "sendBeacon") {
        navigator.sendBeacon(payload.url, payload.data);
      } else if (payload.type === "debugLog") {
        logDebugMessage(payload.level, ...payload.args);
      }
    });
  });
}
export function handleMethodResponse(data) {
  const requestState = requestStates.get(data.messageId);
  if (requestState) {
    if (data.error) {
      requestState.reject(data.error);
    } else {
      requestState.resolve(data.response);
    }
  }
}
export function handleMethodCallback(data) {
  requestStates.get(data.messageId)?.callback?.(...data.callbackArgs);
}
function makeRequestToMaster(message) {
  const messageId = generateUniqueId();
  const payload = {
    messageId,
    ...message,
  };
  const requestState = { messageId };
  // Re-wrap type because of `postMessage`
  const promise = new Promise((resolve, reject) => {
    Object.assign(requestState, { resolve, reject });
  });
  if (
    "args" in payload &&
    "name" in payload &&
    typeof payload.args[1] === "function"
  ) {
    payload.withCallback = true;
    const callback = payload.args.pop();
    requestState.callback = callback;
    requestStatesByCallback.set(callback, requestState);
  }
  requestStates.set(messageId, requestState);
  promise
    .catch(() => undefined)
    .finally(() => {
      requestStates.delete(messageId);
      if (requestState.callback) {
        requestStatesByCallback.delete(requestState.callback);
      }
    });
  callApiOnMasterTab(payload);
  return promise;
}
function makeRequest(message) {
  const messageId = generateUniqueId();
  const payload = {
    messageId,
    ...message,
  };
  const requestState = { messageId };
  // Re-wrap type because of `postMessage`
  const promise = new Promise((resolve, reject) => {
    Object.assign(requestState, { resolve, reject });
  });
  if (
    "args" in payload &&
    "name" in payload &&
    typeof payload.args[1] === "function"
  ) {
    payload.withCallback = true;
    const callback = payload.args.pop();
    requestState.callback = callback;
    requestStatesByCallback.set(callback, requestState);
  }
  requestState.DEBUG_payload = payload;
  requestStates.set(messageId, requestState);
  promise
    .catch(() => undefined)
    .finally(() => {
      requestStates.delete(messageId);
      if (requestState.callback) {
        requestStatesByCallback.delete(requestState.callback);
      }
    });
  postMessageOnTickEnd(payload);
  return promise;
}
const startedAt = Date.now();
// Workaround for iOS sometimes stops interacting with worker
function setupIosHealthCheck() {
  window.addEventListener("focus", () => {
    void ensureWorkerPing();
    // Sometimes a single check is not enough
    setTimeout(() => ensureWorkerPing(), 1000);
  });
}
async function ensureWorkerPing() {
  let isResolved = false;
  try {
    await Promise.race([
      makeRequest({ type: "ping" }),
      pause(HEALTH_CHECK_TIMEOUT).then(() =>
        isResolved
          ? undefined
          : Promise.reject(new Error("HEALTH_CHECK_TIMEOUT"))
      ),
    ]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    if (Date.now() - startedAt >= HEALTH_CHECK_MIN_DELAY) {
      worker?.terminate();
      worker = undefined;
      updateCallback({ "@type": "requestReconnectApi" });
    }
  } finally {
    isResolved = true;
  }
}
