require("dotenv/config");

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME ?? "purrfect-fly",
      script: "pnpm",
      args: "start",
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
