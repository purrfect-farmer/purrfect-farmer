/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Accounts", "timeZone", {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn("Accounts", "locale", {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Accounts", "locale");
  await queryInterface.removeColumn("Accounts", "timeZone");
}
