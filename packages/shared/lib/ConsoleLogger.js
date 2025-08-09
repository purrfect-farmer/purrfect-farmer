import BaseLogger from "./BaseLogger.js";

export default class ConsoleLogger extends BaseLogger {
  /** Output messages to the console */
  output(...args) {
    console.log(...args);
  }

  /** Clear the console */
  clear() {
    console.clear();
  }
}
