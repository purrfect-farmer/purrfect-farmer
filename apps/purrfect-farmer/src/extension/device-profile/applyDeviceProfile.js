import { createDevice } from "@purrfect/shared/lib/device/createDevice";
import { defineNativeGetter } from "./native";
import { installConnection, installNavigator } from "./navigator";
import { installScreen } from "./screen";
import { installTouch } from "./touch";
import { installUserAgentData } from "./userAgentData";
import { installWebGL } from "./webgl";

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

/** Make the page see the account's phone, or only its user agent when the account is unknown */
export function applyAccountDevice(userId, userAgent) {
  if (!userId) {
    defineNativeGetter(Navigator.prototype, "userAgent", () => userAgent);
    return;
  }

  const { profile, devicePixelRatio } = createDevice(userId, userAgent);

  applyDeviceProfile({ userAgent, profile, devicePixelRatio });
}
