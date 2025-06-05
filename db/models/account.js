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
      Account.hasMany(models.Subscription, { as: "subscriptions" });
      Account.hasMany(models.Farmer, { as: "farmers" });
      Account.hasMany(models.Payment, { as: "payments" });
    }

    static findWithActiveSubscription(id, required = true) {
      return this.findByPk(id, {
        include: [
          {
            required,
            association: "subscriptions",
            where: {
              status: "active",
            },
          },
        ],
      });
    }

    get subscription() {
      return this.subscriptions?.find((item) => item.active);
    }
  }
  Account.init(
    {
      title: DataTypes.STRING,
      session: DataTypes.STRING,
      proxy: DataTypes.STRING,
      user: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "Account",
    }
  );
  return Account;
};
