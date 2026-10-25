import { TELEGRAM_SESSION_STATUS } from "../enums/telegram-session-status.js";
import { delay } from "./delay.js";

/** Time a session check may take, client included, before it is an error */
const SESSION_CHECK_TIMEOUT = 20_000;

/** RPC errors of a session that was signed out */
export const LOGGED_OUT_ERRORS = new Set([
  "AUTH_KEY_UNREGISTERED",
  "AUTH_KEY_DUPLICATED",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
]);

/** RPC errors of a deleted or banned user */
export const DEACTIVATED_ERRORS = new Set([
  "USER_DEACTIVATED",
  "USER_DEACTIVATED_BAN",
]);

/** Map a failed request onto a session status, anything unknown is an error */
export function getSessionStatusFromError(error) {
  const message = error?.errorMessage;

  if (LOGGED_OUT_ERRORS.has(message)) {
    return TELEGRAM_SESSION_STATUS.LOGGED_OUT;
  }

  if (DEACTIVATED_ERRORS.has(message)) {
    return TELEGRAM_SESSION_STATUS.DEACTIVATED;
  }

  return TELEGRAM_SESSION_STATUS.ERROR;
}

/**
 * Ask Telegram for the signed in user of the client `acquire` resolves
 * with (`{ client, dispose }`), giving up after `timeout` milliseconds.
 * Errors from `acquire` itself are thrown, and the client is always
 * disposed, even when it arrives after the timeout.
 */
export async function getSessionStatus(
  acquire,
  { timeout = SESSION_CHECK_TIMEOUT } = {},
) {
  const controller = new AbortController();
  const acquiring = acquire();

  const checking = acquiring.then(({ client }) =>
    client
      .getMe()
      .then(() => TELEGRAM_SESSION_STATUS.ACTIVE, getSessionStatusFromError),
  );

  const timedOut = delay(timeout, {
    precised: true,
    signal: controller.signal,
  }).then(() => TELEGRAM_SESSION_STATUS.ERROR);

  try {
    return await Promise.race([checking, timedOut]);
  } finally {
    controller.abort();
    acquiring.then(
      ({ dispose }) => dispose(),
      () => {},
    );
  }
}
