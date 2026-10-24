import { SPOOF_MINI_APP_DEVICE } from "@/constants";
import { createDevice } from "@purrfect/shared/lib/device/createDevice";
import { defineNativeGetter } from "./native";
import { installConnection, installNavigator } from "./navigator";
import { installScreen } from "./screen";
import { installTouch } from "./touch";
import { installUserAgentData } from "./userAgentData";
import { installWebGL } from "./webgl";

/** The browser's own User-Agent, read before anything is patched */
const NATIVE_USER_AGENT = navigator.userAgent;

/** The device the page currently sees */
let current = null;

const read = () => current;

/** Hook every fingerprint surface once, each reading the current device */
function install() {
  installNavigator(read);
  installConnection(read);
  installUserAgentData(read);
  installScreen(read);
  installTouch();
  installWebGL(read);
}

/** Make the page see the account's phone: `{ userAgent, profile, devicePixelRatio }` from `createDevice` */
export function applyDeviceProfile(device) {
  const isFirst = current === null;

  current = device;

  if (isFirst) install();
}

/** Make the page see the account's phone; without a User-Agent yet, the browser's own stands in until one is applied */
export function applyAccountDevice(userId, userAgent = null) {
  if (!SPOOF_MINI_APP_DEVICE || !userId) {
    if (userAgent) {
      defineNativeGetter(Navigator.prototype, "userAgent", () => userAgent);
    }

    return;
  }

  const deviceUserAgent = userAgent || NATIVE_USER_AGENT;
  const { profile, devicePixelRatio } = createDevice(userId, deviceUserAgent);

  applyDeviceProfile({ userAgent: deviceUserAgent, profile, devicePixelRatio });
}
