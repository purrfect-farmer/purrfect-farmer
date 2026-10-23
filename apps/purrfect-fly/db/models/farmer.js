import { Model } from "sequelize";
import utils from "../../lib/utils.js";

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {import("sequelize").DataTypes} DataTypes
 */
export default (sequelize, DataTypes) => {
  class Farmer extends Model {
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

    setHeaders(headers = {}) {
      this.headers = Object.assign(this.headers || {}, headers);

      return this;
    }

    get initDataUnsafe() {
      return utils.getInitDataUnsafe(this.initData);
    }

    get telegramWebApp() {
      return {
        initData: this.initData,
        initDataUnsafe: this.initDataUnsafe,
      };
    }
  }

  Farmer.init(
    {
      accountId: DataTypes.BIGINT,
      farmer: DataTypes.STRING,
      status: DataTypes.STRING,
      errorCount: DataTypes.INTEGER,
      initData: DataTypes.STRING,
      headers: DataTypes.JSON,
      cookies: DataTypes.JSON,
      options: DataTypes.JSON,
      storage: DataTypes.JSON,
      referralLink: DataTypes.STRING,
      frozenUntil: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Farmer",
    },
  );
  return Farmer;
};
