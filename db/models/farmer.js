"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Farmer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Farmer.belongsTo(models.Account, {
        foreignKey: "telegramUserId",
        targetKey: "telegramUserId",
        as: "account",
      });
    }

    static findWithActiveSubscription(farmer, telegramUserId) {
      return this.findOne({
        where: {
          farmer,
          telegramUserId,
        },
        include: [
          {
            required: true,
            association: "account",
            include: [
              {
                association: "subscriptions",
                where: {
                  status: "active",
                },
              },
            ],
          },
        ],
      });
    }
  }
  Farmer.init(
    {
      farmer: DataTypes.STRING,
      telegramUserId: DataTypes.BIGINT,
      telegramWebApp: DataTypes.JSON,
      headers: DataTypes.JSON,
      isConnected: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Farmer",
    }
  );
  return Farmer;
};
