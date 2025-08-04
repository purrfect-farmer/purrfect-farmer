"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    const bcrypt = require("bcryptjs");
    const db = require("../models");

    await db.User.findOrCreate({
      where: {
        username: "admin",
      },
      defaults: {
        name: "Admin",
        email: "admin@example.com",
        password: await bcrypt.hash("password", 10),
        emailVerifiedAt: new Date(),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    const db = require("../models");
    await db.User.destroy({ where: { username: "admin" } });
  },
};
