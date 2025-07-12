/* eslint-disable no-console */
export const DEBUG_LEVELS = ['log', 'error', 'warn', 'info', 'debug'];
// @ts-ignore
const ORIGINAL_FUNCTIONS = DEBUG_LEVELS.reduce((acc, level) => {
    // @ts-ignore
    acc[level] = console[level];
    return acc;
}, {});
let DEBUG_LOGS = [];
export function logDebugMessage(level, ...args) {
    DEBUG_LOGS.push({
        level,
        args,
        date: new Date(),
    });
    ORIGINAL_FUNCTIONS[level](...args);
}
export function initDebugConsole() {
    DEBUG_LOGS = [];
    DEBUG_LEVELS.forEach((level) => {
        // @ts-ignore
        console[level] = (...args) => {
            logDebugMessage(level, ...args);
        };
    });
}
export function disableDebugConsole() {
    DEBUG_LEVELS.forEach((level) => {
        // @ts-ignore
        console[level] = ORIGINAL_FUNCTIONS[level];
    });
    DEBUG_LOGS = [];
}
export function getDebugLogs() {
    return JSON.stringify(DEBUG_LOGS, (key, value) => (typeof value === 'bigint'
        ? value.toString()
        : value));
}
