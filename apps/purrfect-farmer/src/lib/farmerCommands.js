export const FARMER_COMMAND = "farmer.command";
export const FARMER_COMMAND_RESULT = "farmer.command-result";

/** Long enough for a human to solve a withdrawal captcha in the other window */
export const DEFAULT_COMMAND_TIMEOUT = 5 * 60 * 1000;

/**
 * What a farmer answers, mapped onto the Auto adapter every drop already
 * implements (`BaseFarmer`), so adding a drop adds no command wiring.
 */
export const FARMER_COMMANDS = {
  "connect-wallet": (instance, payload) => instance.connectAutoWallet(payload),
  withdraw: (instance, payload) => instance.withdraw(payload || {}),
  refresh: (instance) => instance.refreshAutoState(),
  summary: (instance) => instance.getAutoSummary(),
};

/** Whether a command envelope is addressed to this farmer instance */
export function isCommandForFarmer(payload, farmerId, userId) {
  return Boolean(
    payload &&
    payload.command &&
    payload.farmerId === farmerId &&
    userId !== null &&
    typeof userId !== "undefined" &&
    String(payload.userId) === String(userId),
  );
}

export function normalizeCommandResult(result) {
  return typeof result?.status === "boolean"
    ? result
    : { status: true, result };
}

/**
 * Subscribes to a mirror action, returning the unsubscribe.
 */
export function onMirrorAction(handler, action, listener) {
  handler.setMaxListeners(0);
  handler.on(action, listener);

  return () => handler.off(action, listener);
}
