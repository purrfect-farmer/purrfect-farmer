/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Payments", {
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
    reference: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    data: {
      allowNull: false,
      type: Sequelize.JSON,
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
  await queryInterface.dropTable("Payments");
}
