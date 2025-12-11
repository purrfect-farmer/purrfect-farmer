import AnsiToHtml from "ansi-to-html";

import BaseLogger from "./BaseLogger.js";

export default class BrowserLogger extends BaseLogger {
  constructor() {
    super();
    this.converter = new AnsiToHtml();
  }

  /** Set Terminal Element
   * @param {HTMLElement} element - The terminal div element
   */
  setElement(element) {
    this.terminalDiv = element;
  }

  /** Set Scroll Element
   * @param {HTMLElement} element - The scrollable element
   */
  setScrollElement(element) {
    this.scrollElement = element;
  }

  /** Output messages with HTML conversion */
  output(...args) {
    if (!this.enabled) return;
    if (!this.terminalDiv) {
      console.warn("Terminal element not set. Use setElement() to set it.");
      console.log(...args);
      return;
    }
    const line = args.join(" ");
    const html = this.converter.toHtml(line);
    this.terminalDiv.innerHTML += html + "<br/>";

    const scrollTarget = this.scrollElement || this.terminalDiv;
    scrollTarget.scrollTop = scrollTarget.scrollHeight; // Auto-scroll
  }

  /** Clear the terminal */
  clear() {
    this.terminalDiv.innerHTML = "";
  }
}
