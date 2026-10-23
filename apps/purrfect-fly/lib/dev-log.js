/** Log an error only in development */
export function logDevError(...args) {
  if (process.env.NODE_ENV === "development") {
    console.error(...args);
  }
}
