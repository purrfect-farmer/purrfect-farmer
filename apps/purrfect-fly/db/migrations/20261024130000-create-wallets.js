/** Indexes for finding an Auto's wallets by public key, owner and bound account */
const INDEXES = [
  ["drop", "publicKey"],
  ["ownerId", "drop"],
  ["accountId", "drop"],
];

/** Stable name for an index, so `down` can find it */
const indexName = (fields) => `wallets_${fields.join("_").toLowerCase()}`;

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Wallets", {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
    },
    ownerId: {
      allowNull: false,
      type: Sequelize.BIGINT,
    },
    accountId: {
      type: Sequelize.BIGINT,
    },
    drop: {
      type: Sequelize.STRING,
    },
    role: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    chain: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    version: {
      allowNull: false,
      type: Sequelize.INTEGER,
    },
    publicKey: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    address: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    encryptedPhrase: {
      allowNull: false,
      type: Sequelize.TEXT,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });

  for (const fields of INDEXES) {
    await queryInterface.addIndex("Wallets", fields, {
      name: indexName(fields),
    });
  }
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 */
export async function down(queryInterface) {
  await queryInterface.dropTable("Wallets");
}
