/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Farmers", "frozenUntil", {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Farmers", "frozenUntil");
}
