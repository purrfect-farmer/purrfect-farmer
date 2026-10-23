import db from "../db/models/index.js";
import farmers from "../farmers/index.js";

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
  const activeFarmers = await db.Farmer.findAll({
    attributes: ["id", "accountId", "farmer"],
  });

  /* Find duplicate farmers, keeping the first row of each account and farmer */
  const seen = new Set();
  const duplicateFarmers = activeFarmers.filter((farmer) => {
    const key = `${farmer.accountId}:${farmer.farmer}`;
    const isDuplicate = seen.has(key);

    seen.add(key);

    return isDuplicate;
  });

  /* Log number of duplicate farmers */
  console.log("Number of Duplicate Farmers:", duplicateFarmers.length);

  /* Destroy duplicate farmers */
  await db.Farmer.destroy({
    where: {
      id: { [db.Sequelize.Op.in]: duplicateFarmers.map((f) => f.id) },
    },
  });
}

export default cleanDatabase;
