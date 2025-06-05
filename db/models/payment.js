"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Payment.belongsTo(models.Account, {
        foreignKey: "telegramUserId",
        targetKey: "telegramUserId",
        as: "account",
      });
    }
  }
  Payment.init(
    {
      telegramUserId: DataTypes.BIGINT,
      reference: DataTypes.STRING,
      data: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "Payment",
    }
  );
  return Payment;
};
