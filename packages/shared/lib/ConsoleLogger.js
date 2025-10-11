import BaseLogger from "./BaseLogger.js";

export default class ConsoleLogger extends BaseLogger {
  /** Output messages to the console */
  output(...args) {
    if (!this.enabled) return;
    console.log(...args);
  }

  /** Clear the console */
  clear() {
    console.clear();
  }
}
