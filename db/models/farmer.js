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
      Farmer.belongsTo(models.Account, { as: "account" });
    }

    static findWithActiveSubscription(farmer, accountId, required = false) {
      return this.findOne({
        where: {
          farmer,
          accountId,
        },
        include: [
          {
            required: true,
            association: "account",
            include: [
              {
                required,
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
      accountId: DataTypes.BIGINT,
      telegramInitData: DataTypes.STRING,
      headers: DataTypes.JSON,
      active: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Farmer",
    }
  );
  return Farmer;
};
