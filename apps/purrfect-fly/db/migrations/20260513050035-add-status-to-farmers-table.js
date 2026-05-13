/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.removeConstraint(
    "Farmers",
    "Farmers_accountId_farmer_uk",
  );
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.removeColumn("Farmers", "active", { transaction });
    await queryInterface.removeColumn("Farmers", "isBanned", { transaction });
  });

  await queryInterface.addColumn("Farmers", "status", {
    type: Sequelize.STRING,
    defaultValue: "active",
    allowNull: true,
  });

  await queryInterface.sequelize.query("PRAGMA foreign_keys = ON");
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Farmers", "status");
  await queryInterface.addColumn("Farmers", "active", {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: true,
  });
  await queryInterface.addColumn("Farmers", "isBanned", {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  });
}
