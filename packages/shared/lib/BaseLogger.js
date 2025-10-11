import chalk from "chalk";

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
  keyValue(label, value, labelDefaultStyle, valueDefaultStyle) {
    const labelStyle = labelDefaultStyle || this.c.gray;
    const valueStyle = valueDefaultStyle || this.c.cyan;

    const rawLabel = label + ":";

    return this.log(`${labelStyle(rawLabel.padEnd(8))} ${valueStyle(value)}`);
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
}
