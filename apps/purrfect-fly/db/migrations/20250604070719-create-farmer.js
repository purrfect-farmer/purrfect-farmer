/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Farmers", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    accountId: {
      allowNull: false,
      references: {
        model: "Accounts",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      type: Sequelize.BIGINT,
    },
    farmer: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "active",
    },
    errorCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    initData: {
      type: Sequelize.STRING,
    },
    headers: {
      type: Sequelize.JSON,
      defaultValue: {},
    },
    cookies: {
      type: Sequelize.JSON,
      defaultValue: [],
    },
    options: {
      type: Sequelize.JSON,
      defaultValue: {},
    },
    storage: {
      type: Sequelize.JSON,
      defaultValue: {},
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
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("Farmers");
}
