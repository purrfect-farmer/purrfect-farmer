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
      Account.hasMany(models.Subscription, {
        foreignKey: "telegramUserId",
        targetKey: "telegramUserId",
        as: "subscriptions",
      });

      Account.hasMany(models.Farmer, {
        foreignKey: "telegramUserId",
        targetKey: "telegramUserId",
        as: "farmers",
      });

      Account.hasMany(models.Payment, {
        foreignKey: "telegramUserId",
        targetKey: "telegramUserId",
        as: "payments",
      });
    }

    static findWithActiveSubscription(telegramUserId) {
      return this.findOne({
        where: {
          telegramUserId,
        },
        include: [
          {
            required: true,
            association: "subscriptions",
            where: {
              status: "active",
            },
          },
        ],
      });
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
