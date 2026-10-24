import autos from "../lib/autos.js";
import farmers from "../farmers/index.js";

/** Whether an Auto run or a farmer runner of any drop is working the account right now */
export function isAccountInUse(id) {
  return (
    Object.values(autos).some((Auto) => Auto.isHoldingAccount(id)) ||
    Object.values(farmers).some((Runner) => Runner.runners.has(id))
  );
}
