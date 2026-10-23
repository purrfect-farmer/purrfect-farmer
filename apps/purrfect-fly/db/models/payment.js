import { Model } from "sequelize";

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {import("sequelize").DataTypes} DataTypes
 */
export default (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Account, { as: "account" });
    }
  }
  Payment.init(
    {
      accountId: DataTypes.BIGINT,
      reference: DataTypes.STRING,
      data: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "Payment",
    },
  );
  return Payment;
};
