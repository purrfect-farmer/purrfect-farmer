import chalk from "chalk";
import { formatNumber } from "../utils/core.js";

export default class BaseLogger {
  constructor(enabled = true) {
    this.enabled = enabled; // Logger is enabled by default
    this.chalk = chalk;
    this.c = this.chalk; // Alias for convenience
  }

  /** Enable the logger */
  enableLogger() {
    this.enabled = true;
  }

  /** Disable the logger */
  disableLogger() {
    this.enabled = false;
  }

  /** Log messages */
  log(...args) {
    return this.output(this.chalk.bold(...args));
  }

  /** Log key-value pairs */
  keyValue(label, value, { labelStyle, valueStyle, format = true } = {}) {
    const selectedLabelStyle = labelStyle || this.c.gray;
    const selectedValueStyle = valueStyle || this.c.cyan;

    const rawLabel = label + ":";
    const displayedLabel = selectedLabelStyle(rawLabel.padEnd(8));
    const displayedValue = selectedValueStyle(
      format && typeof value === "number" ? formatNumber(value) : value,
    );

    return this.log(`${displayedLabel} ${displayedValue}`);
  }

  /** Newline */
  newline() {
    return this.output("");
  }

  /** Log success messages with green color */
  success(...args) {
    return this.output(this.chalk.bold.green(...args));
  }

  /** Log info messages with bright blue color */
  info(...args) {
    return this.output(this.chalk.bold.blueBright(...args));
  }

  /** Log warning messages with yellow color */
  warn(...args) {
    return this.output(this.chalk.bold.yellow(...args));
  }

  /** Log error messages with red color */
  error(...args) {
    return this.output(this.chalk.bold.red(...args));
  }

  /** Log debug messages with gray color */
  debug(...args) {
    return this.output(this.chalk.bold.gray(...args));
  }

  /** Output a message */
  output(...args) {
    throw new Error("output must be implemented in subclass");
  }

  /** Clear the console */
  clear() {
    throw new Error("clear must be implemented in subclass");
  }

  /** Force the output */
  force(callback) {
    const previous = this.enabled;
    this.enabled = true;
    callback();
    this.enabled = previous;
  }
}
