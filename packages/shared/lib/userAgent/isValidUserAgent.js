/** Longest User-Agent an account can store */
export const MAX_USER_AGENT_LENGTH = 255;

/** An Android mobile User-Agent */
const ANDROID_USER_AGENT_REGEX = /^Mozilla\/5\.0 \(Linux; Android \d+/;

/** Whether a value is an Android User-Agent an account can store */
export default function isValidUserAgent(value) {
  return (
    typeof value === "string" &&
    value.length <= MAX_USER_AGENT_LENGTH &&
    ANDROID_USER_AGENT_REGEX.test(value)
  );
}
