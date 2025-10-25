const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "purrfect-fly",
      script: "pnpm",
      args: "start --options",
      interpreter: "none",
      kill_timeout: 3000,
      cwd: __dirname,
      env: {
        PORT: process.env.PORT || 3000,
        NODE_ENV: process.env.NODE_ENV || "production",
        FORCE_COLOR: true,
      },
    },
  ],
};
