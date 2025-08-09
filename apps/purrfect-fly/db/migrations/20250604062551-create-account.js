export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Accounts", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    title: {
      type: Sequelize.STRING,
    },
    session: {
      type: Sequelize.STRING,
    },
    proxy: {
      type: Sequelize.STRING,
    },
    user: {
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
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("Accounts");
}
