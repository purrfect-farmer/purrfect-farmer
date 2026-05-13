/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable("Farmers");

  if (table.active) {
    await queryInterface.removeColumn("Farmers", "active");
  }
  if (table.isBanned) {
    await queryInterface.removeColumn("Farmers", "isBanned");
  }
  if (!table.status) {
    await queryInterface.addColumn("Farmers", "status", {
      type: Sequelize.STRING,
      defaultValue: "active",
      allowNull: false,
    });
  }
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function down(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable("Farmers");

  if (table.status) {
    await queryInterface.removeColumn("Farmers", "status");
  }
  if (!table.active) {
    await queryInterface.addColumn("Farmers", "active", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: true,
    });
  }
  if (!table.isBanned) {
    await queryInterface.addColumn("Farmers", "isBanned", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    });
  }
}
