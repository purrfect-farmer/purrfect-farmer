import axios from "axios";

export { v4 as uuid } from "uuid";

export { default as md5 } from "md5";

export * as changeCase from "change-case";

export const randomItem = (items) =>
  items[Math.floor(Math.random() * items.length)];

export function randomPercent(value, min = 0, max = 100) {
  return Math.floor(
    (value * (min + Math.floor(Math.random() * (max - min)))) / 100,
  );
}

export function chance(percent) {
  return Math.random() < percent / 100;
}

export function shuffle(array) {
  const results = [...array];
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results;
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

/** Chunk array generator */
export function* chunkArrayGenerator(arr, size) {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

/** Format a span of seconds as its largest parts, e.g. "3d 1h 45m"
 * @param {number} seconds
 */
export function formatDurationParts(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(" ");
}
