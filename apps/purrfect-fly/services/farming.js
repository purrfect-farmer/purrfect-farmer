import farmers from "../farmers/index.js";

/** Toggle whether scheduled farming may pick an account up */
export async function setAccountFarming(account, farming) {
  /** Merge, so the options bag stays open for other keys */
  await account.update({
    options: { ...(account.options || {}), farming },
  });

  /** Switching off stops a pass under way, since another server may now use the session */
  if (!farming) {
    for (const FarmerClass of Object.values(farmers)) {
      FarmerClass.abort(account.id);
    }
  }
}
