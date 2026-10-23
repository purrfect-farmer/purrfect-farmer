import { format } from "date-fns";

/** A date as shown in bot messages */
export function formatDateTime(date = new Date()) {
  return format(date, "yyyy-MM-dd HH:mm:ss");
}
