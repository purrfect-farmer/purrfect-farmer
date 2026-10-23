import { ACTIVE_FARMER_FIELDS } from "./farmer-activation.js";
import { FARMER_STATUS } from "../enums/farmer-status.js";
import db from "../db/models/index.js";
import farmers from "../farmers/index.js";

/** Stop the running instance of one farmer row */
function terminateFarmer(dbFarmer) {
  farmers[dbFarmer.farmer]?.terminate(dbFarmer.accountId);
}

/** Set a farmer's status, stopping its instance unless it is being activated */
export async function setFarmerStatus(dbFarmer, status) {
  if (status === FARMER_STATUS.ACTIVE) {
    return dbFarmer.update(ACTIVE_FARMER_FIELDS);
  }

  terminateFarmer(dbFarmer);

  return dbFarmer.update({ status, frozenUntil: null });
}

/** Stop a farmer's instance and delete its row */
export async function removeFarmer(dbFarmer) {
  terminateFarmer(dbFarmer);

  await dbFarmer.destroy();
}

/** Stop every running instance of a farmer type */
async function terminateFarmerType(farmer) {
  const FarmerClass = farmers[farmer];

  if (!FarmerClass) return;

  const dbFarmers = await db.Farmer.findAll({
    where: { farmer },
    attributes: ["accountId"],
  });

  for (const dbFarmer of dbFarmers) {
    FarmerClass.terminate(dbFarmer.accountId);
  }
}

/** Stop a farmer type and set a status on all its rows */
export async function setFarmerTypeStatus(farmer, status) {
  await terminateFarmerType(farmer);

  const [affectedCount] = await db.Farmer.update(
    { status, frozenUntil: null },
    { where: { farmer } },
  );

  return affectedCount;
}

/** Stop a farmer type and delete all its rows */
export async function removeFarmerType(farmer) {
  await terminateFarmerType(farmer);

  return db.Farmer.destroy({ where: { farmer } });
}
