import chalk from "chalk";

export default class BaseLogger {
  constructor() {
    this.chalk = chalk;
    this.c = this.chalk;
  }

  /** Log messages */
  log(...args) {
    return this.output(this.chalk.bold(...args));
  }

  /** Log key-value pairs */
  keyValue(label, value) {
    const labelStyle = this.c.gray.bold;
    const valueStyle = this.c.whiteBright;
    return this.info(
      `${labelStyle(label + ":").padEnd(12)} ${valueStyle(value)}`
    );
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
