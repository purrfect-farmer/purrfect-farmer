import AnsiToHtml from "ansi-to-html";

import BaseLogger from "./BaseLogger.js";

export default class BrowserLogger extends BaseLogger {
  constructor() {
    super();
    this.converter = new AnsiToHtml();
  }

  /** Set Terminal Element */
  setElement(element) {
    this.terminalDiv = element;
  }

  /** Output messages with HTML conversion */
  output(...args) {
    const line = args.join(" ");
    const html = this.converter.toHtml(line);
    this.terminalDiv.innerHTML += html + "<br/>";
    this.terminalDiv.scrollTop = this.terminalDiv.scrollHeight; // Auto-scroll
  }

  /** Clear the terminal */
  clear() {
    this.terminalDiv.innerHTML = "";
  }
}
