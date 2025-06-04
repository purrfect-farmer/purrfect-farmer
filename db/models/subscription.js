"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Subscription.belongsTo(models.Account, {
        foreignKey: "telegramUserId",
        targetKey: "telegramUserId",
      });
    }
  }
  Subscription.init(
    {
      telegramUserId: DataTypes.BIGINT,
      status: DataTypes.ENUM,
      startsAt: DataTypes.DATE,
      endsAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Subscription",
    }
  );
  return Subscription;
};
