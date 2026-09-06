import db from "../db/models/index.js";

/** Clean Database */
async function cleanDatabase() {
  /* Get all farmer IDs */
  const farmerIds = Object.keys(farmers);

  /* Log farmer IDs */
  console.log("Farmer IDs:", farmerIds);

  /* Destroy farmers not in farmer IDs */
  await db.Farmer.destroy({
    where: {
      farmer: { [db.Sequelize.Op.notIn]: farmerIds },
    },
  });

  /* Get all active farmers */
  const farmers = await db.Farmer.findAll();

  /* Find duplicate farmers */
  const duplicateFarmers = farmers.filter(
    (farmer, index, self) =>
      self.findIndex(
        (t) => t.accountId === farmer.accountId && t.farmer === farmer.farmer,
      ) !== index,
  );

  /* Log duplicate farmers */
  console.log("Duplicate Farmers:", duplicateFarmers);

  /* Destroy duplicate farmers */
  await db.Farmer.destroy({
    where: {
      id: { [db.Sequelize.Op.in]: duplicateFarmers.map((f) => f.id) },
    },
  });
}

export default cleanDatabase;
