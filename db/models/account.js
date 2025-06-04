"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Account.init(
    {
      telegramUserId: DataTypes.BIGINT,
      telegramSessionId: DataTypes.STRING,
      proxy: DataTypes.STRING,
      data: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "Account",
    }
  );
  return Account;
};
