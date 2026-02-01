import axios from "axios";

export { v4 as uuid } from "uuid";

export { default as md5 } from "md5";

export const randomItem = (items) =>
  items[Math.floor(Math.random() * items.length)];

export function randomPercent(value, min = 0, max = 100) {
  return Math.floor(
    (value * (min + Math.floor(Math.random() * (max - min)))) / 100,
  );
}

export function extraGamePoints(points, percent = 20) {
  return points + randomPercent(points, 0, percent);
}

/** Fetch Content */
export function fetchContent(url, ...options) {
  return axios.get(url, ...options).then((res) => res.data);
}

/** With Value */
export function withValue(value, callback) {
  return callback ? callback(value) : (callback) => callback(value);
}

/** Tap Value */
export function tapValue(value, callback) {
  if (callback) {
    callback(value);
  }
  return callback
    ? value
    : (callback) => {
        callback(value);
        return value;
      };
}

/** Format number
 * @param {number} value
 */
export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
