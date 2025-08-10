import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
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

    static findWithActiveSubscription(
      id,
      { required = true, ...options } = {}
    ) {
      return this.findByPk(id, {
        ...options,
        include: [
          {
            required,
            association: "subscriptions",
            where: {
              active: true,
            },
          },
        ],
      });
    }

    static findAllWithActiveSubscription({ required = true, ...options } = {}) {
      return this.findAll({
        ...options,
        include: [
          {
            required,
            association: "subscriptions",
            where: {
              active: true,
            },
          },
        ],
      });
    }

    static findAllFarmers(options) {
      return this.findAll({
        ...options,
        include: [
          {
            required: true,
            association: "farmers",
            attributes: {
              exclude: ["headers", "initData"],
            },
          },
          {
            required: true,
            association: "subscriptions",
            where: {
              active: true,
            },
          },
        ],
      });
    }

    static findSubscribedWithFarmer(farmer, required = false, options) {
      return this.findAll({
        ...options,
        include: [
          {
            required,
            association: "farmers",
            where: {
              farmer,
            },
          },
          {
            required: true,
            association: "subscriptions",
            where: {
              active: true,
            },
          },
        ],
      });
    }

    get subscription() {
      return this.subscriptions?.find((item) => item.active);
    }

    get farmer() {
      return this.farmers[0];
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
