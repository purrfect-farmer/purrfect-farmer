import farmers from "../farmers/index.js";
import db from "../db/models/index.js";

/** Clean Database */
async function cleanDatabase() {
  const farmerIds = Object.keys(farmers);

  console.log("Farmer IDs:", farmerIds);
  await db.Farmer.destroy({
    where: {
      farmer: { [db.Sequelize.Op.notIn]: farmerIds },
    },
  });
}

export default cleanDatabase;
