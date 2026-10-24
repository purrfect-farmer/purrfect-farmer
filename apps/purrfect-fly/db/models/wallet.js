import { Model } from "sequelize";

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {import("sequelize").DataTypes} DataTypes
 */
export default (sequelize, DataTypes) => {
  class Wallet extends Model {}

  Wallet.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      ownerId: DataTypes.BIGINT,
      accountId: DataTypes.BIGINT,
      drop: DataTypes.STRING,
      role: DataTypes.STRING,
      chain: DataTypes.STRING,
      version: DataTypes.INTEGER,
      publicKey: DataTypes.STRING,
      address: DataTypes.STRING,
      encryptedPhrase: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Wallet",
    },
  );

  return Wallet;
};
