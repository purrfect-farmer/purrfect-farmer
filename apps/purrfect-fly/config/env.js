import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

global.env = function (key, defaultValue) {
  let value = process.env[key];

  if (value === undefined) return defaultValue;

  value = value.trim();

  switch (value.toLowerCase()) {
    case "true":
    case "(true)":
      return true;
    case "false":
    case "(false)":
      return false;
    case "null":
    case "(null)":
      return null;
    case "empty":
    case "(empty)":
      return "";
  }

  if (!isNaN(value) && value !== "") {
    return Number(value);
  }

  return value;
};
