import { downloadFile, getCookies, parseHTML, setCookies } from ".";

import { encryption } from "@/services/encryption";
import sharedUtils from "@purrfect/shared/utils/bundle.js";

export default {
  ...sharedUtils,
  encryption,
  downloadFile,
  getCookies,
  setCookies,
  parseHTML,
};
