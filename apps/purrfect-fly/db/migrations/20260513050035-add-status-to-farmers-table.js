/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  return queryInterface.sequelize.transaction(async (t) => {
    return Promise.all([
      queryInterface.removeColumn("Farmers", "active", { transaction: t }),
      queryInterface.removeColumn("Farmers", "isBanned", {
        transaction: t,
      }),
      queryInterface.addColumn(
        "Farmers",
        "status",
        {
          type: Sequelize.STRING,
          defaultValue: "active",
          allowNull: true,
        },
        { transaction: t },
      ),
    ]);
  });
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function down(queryInterface, Sequelize) {
  return queryInterface.sequelize.transaction((t) => {
    return Promise.all([
      queryInterface.removeColumn("Farmers", "status", { transaction: t }),
      queryInterface.addColumn(
        "Farmers",
        "active",
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: true,
        },
        { transaction: t },
      ),
      queryInterface.addColumn(
        "Farmers",
        "isBanned",
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: true,
        },
        { transaction: t },
      ),
    ]);
  });
}
