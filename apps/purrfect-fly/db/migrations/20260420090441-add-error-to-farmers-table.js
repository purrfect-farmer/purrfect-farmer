/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Farmers", "errorCount", {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  });

  await queryInterface.addColumn("Farmers", "isBanned", {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  });
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Farmers", "errorCount");
  await queryInterface.removeColumn("Farmers", "isBanned");
}
