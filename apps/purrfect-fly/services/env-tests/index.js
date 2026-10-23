import testCaptcha from "./captcha.js";
import testProxy from "./proxy.js";
import testSeeker from "./seeker.js";
import testTelegram from "./telegram.js";

/** Connection tests per service */
export const ENV_TESTS = Object.freeze({
  telegram: testTelegram,
  captcha: testCaptcha,
  proxy: testProxy,
  seeker: testSeeker,
});
