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
    logging: false,
  },
};
