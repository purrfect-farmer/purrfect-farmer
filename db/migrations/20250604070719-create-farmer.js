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
      farmer: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      telegramUserId: {
        allowNull: false,
        references: {
          key: "telegramUserId",
          model: "Accounts",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        type: Sequelize.BIGINT,
      },
      telegramWebApp: {
        type: Sequelize.JSON,
      },
      headers: {
        type: Sequelize.JSON,
      },
      isConnected: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
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
      fields: ["farmer", "telegramUserId"],
      type: "unique",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Farmers");
  },
};
