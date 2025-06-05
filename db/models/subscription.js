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
      Subscription.belongsTo(models.Account, { as: "account" });
    }
  }
  Subscription.init(
    {
      accountId: DataTypes.BIGINT,
      status: DataTypes.ENUM("active", "expired"),
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
