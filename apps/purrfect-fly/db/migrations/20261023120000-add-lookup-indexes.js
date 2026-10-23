/** Indexes for the lookups the server runs on every request and cron tick */
const INDEXES = [
  ["Farmers", ["farmer", "accountId"]],
  ["Farmers", ["accountId"]],
  ["Farmers", ["status", "frozenUntil"]],
  ["Subscriptions", ["accountId", "active"]],
  ["Subscriptions", ["endsAt"]],
  ["Payments", ["accountId"]],
];

/** Stable name for an index, so `down` can find it */
const indexName = (table, fields) =>
  `${table.toLowerCase()}_${fields.join("_").toLowerCase()}`;

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 */
export async function up(queryInterface) {
  for (const [table, fields] of INDEXES) {
    await queryInterface.addIndex(table, fields, {
      name: indexName(table, fields),
    });
  }
}

/**
 * @param {import("sequelize").QueryInterface} queryInterface
 */
export async function down(queryInterface) {
  for (const [table, fields] of INDEXES) {
    await queryInterface.removeIndex(table, indexName(table, fields));
  }
}
