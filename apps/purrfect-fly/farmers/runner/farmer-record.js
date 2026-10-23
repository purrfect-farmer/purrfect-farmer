import { BAN_TRIGGER_COUNT } from "./config.js";
import { FARMER_STATUS } from "../../enums/farmer-status.js";

/** Create the farmer row for a runner's account */
export function createFarmerRecord(runner) {
  return runner.account.createFarmer({
    farmer: runner.constructor.id,
    status: FARMER_STATUS.ACTIVE,
    errorCount: 0,
    initData: "",
    headers: {},
    cookies: [],
    storage: {},
    options: {},
  });
}

/** Count a failed run, deactivating the farmer and banning it past the limit */
export async function recordFailure(farmer) {
  farmer.status = FARMER_STATUS.INACTIVE;
  farmer.errorCount += 1;

  if (farmer.errorCount >= BAN_TRIGGER_COUNT) {
    farmer.status = FARMER_STATUS.BANNED;
  }

  await farmer.save();
}

/** Clear the error count after a successful run */
export async function recordSuccess(farmer) {
  if (farmer.errorCount > 0) {
    farmer.status = FARMER_STATUS.ACTIVE;
    farmer.errorCount = 0;

    await farmer.save();
  }
}
