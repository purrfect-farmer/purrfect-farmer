import { FARMER_STATUS } from "../enums/farmer-status.js";
import db from "../db/models/index.js";

/** Fields that put a farmer back into rotation */
export const ACTIVE_FARMER_FIELDS = Object.freeze({
  status: FARMER_STATUS.ACTIVE,
  errorCount: 0,
  frozenUntil: null,
});

/** Activate every farmer row matching `where`, returns the affected count */
export async function activateFarmers(where) {
  const [affectedCount] = await db.Farmer.update(ACTIVE_FARMER_FIELDS, {
    where,
  });

  return affectedCount;
}

/** Activate every farmer that is not frozen, keeping its freeze window */
export async function activateUnfrozenFarmers() {
  const [affectedCount] = await db.Farmer.update(
    { status: FARMER_STATUS.ACTIVE, errorCount: 0 },
    {
      where: {
        status: { [db.Sequelize.Op.not]: FARMER_STATUS.FROZEN },
      },
    },
  );

  return affectedCount;
}
