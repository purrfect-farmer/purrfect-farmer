/**
 * @param {import("sequelize").QueryInterface} queryInterface
 * @param {import("sequelize")} Sequelize
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Subscriptions", {
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
    active: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
    },
    startsAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    endsAt: {
      type: Sequelize.DATE,
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
  await queryInterface.dropTable("Subscriptions");
}
