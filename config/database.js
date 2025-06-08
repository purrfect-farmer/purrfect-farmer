module.exports = {
  development: {
    dialect: "sqlite",
    storage: "./db/database.sqlite",
  },
  test: {
    dialect: "sqlite",
    storage: ":memory:",
  },
  production: {
    dialect: "sqlite",
    storage: "./db/database.sqlite",
    ...(process.env.NODE_ENV === "production" && { logging: false }),
  },
};
