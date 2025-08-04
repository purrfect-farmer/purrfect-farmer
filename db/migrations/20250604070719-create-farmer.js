"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
      active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      farmer: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      initData: {
        type: Sequelize.STRING,
      },
      headers: {
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

    await queryInterface.addConstraint("Farmers", {
      fields: ["accountId", "farmer"],
      type: "unique",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Farmers");
  },
};
