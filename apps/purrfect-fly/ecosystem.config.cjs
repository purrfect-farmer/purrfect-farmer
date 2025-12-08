const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, ".env")));

module.exports = {
  apps: [
    {
      name: env.PM2_APP_NAME || "purrfect-fly",
      script: "pnpm",
      args: "start --options",
      interpreter: "none",
      kill_timeout: 3000,
      cwd: __dirname,
      env: {
        PORT: env.PORT || 3000,
        NODE_ENV: env.NODE_ENV || "production",
        FORCE_COLOR: true,
      },
    },
  ],
};
