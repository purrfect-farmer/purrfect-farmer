"use strict";
const { Model } = require("sequelize");
const utils = require("../../lib/utils");
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

    static _getSubscriptionInclude(required) {
      return [
        {
          required: true,
          association: "account",
          include: [
            {
              required,
              association: "subscriptions",
              where: {
                active: true,
              },
            },
          ],
        },
      ];
    }

    static findWithActiveSubscription(farmer, accountId, required = true) {
      return this.findOne({
        where: {
          farmer,
          accountId,
        },
        include: this._getSubscriptionInclude(required),
      });
    }

    static findAllWithActiveSubscription({ required = true, ...options } = {}) {
      return this.findAll({
        ...options,
        include: this._getSubscriptionInclude(required),
      });
    }

    setAuthorizationHeader(value) {
      this.headers = Object.assign(this.headers || {}, {
        Authorization: value,
      });

      return this;
    }

    get initDataUnsafe() {
      return utils.getInitDataUnsafe(this.initData);
    }
  }
  Farmer.init(
    {
      accountId: DataTypes.BIGINT,
      active: DataTypes.BOOLEAN,
      farmer: DataTypes.STRING,
      initData: DataTypes.STRING,
      headers: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "Farmer",
    }
  );
  return Farmer;
};
