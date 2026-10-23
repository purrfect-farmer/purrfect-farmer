import { Model } from "sequelize";

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {import("sequelize").DataTypes} DataTypes
 */
export default (sequelize, DataTypes) => {
  class Subscription extends Model {
    static associate(models) {
      Subscription.belongsTo(models.Account, { as: "account" });
    }
  }
  Subscription.init(
    {
      accountId: DataTypes.BIGINT,
      active: DataTypes.BOOLEAN,
      startsAt: DataTypes.DATE,
      endsAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Subscription",
    },
  );

  return Subscription;
};
