import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account as the last login returned it */
export default class ATFState extends FarmerModule {
  /** The login payload, with the user record and task cooldowns */
  data = null;

  /** Get User Details */
  user() {
    return this.data.user;
  }
}
