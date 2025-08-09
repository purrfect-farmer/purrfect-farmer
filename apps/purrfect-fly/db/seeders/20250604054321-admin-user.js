import * as bcrypt from "bcryptjs";

export async function up(queryInterface, Sequelize) {
  /**
   * Add seed commands here.
   *
   * Example:
   * await queryInterface.bulkInsert('People', [{
   *   name: 'John Doe',
   *   isBetaMember: false
   * }], {});
   */

  const db = await import("../models/index.js").then((m) => m.default);

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
}
export async function down(queryInterface, Sequelize) {
  const db = await import("../models/index.js").then((m) => m.default);

  await db.User.destroy({ where: { username: "admin" } });
}
