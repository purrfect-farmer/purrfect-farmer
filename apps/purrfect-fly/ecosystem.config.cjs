import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  apps: [
    {
      name: process.env.PM2_APP_NAME ?? "purrfect-fly",
      script: "pnpm",
      args: "start --options",
      interpreter: "none",
      cwd: __dirname,
      env: {
        PORT: process.env.PORT ?? 3000,
        NODE_ENV: process.env.NODE_ENV ?? "production",
        FORCE_COLOR: true,
      },
    },
  ],
};
