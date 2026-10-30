import { Api } from "telegram";

import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { REQUIRED_CHATS } from "./constants.js";

/** The group and channel an entry must stay in */
export default class MiaoushiChats extends FarmerModule {
  /** Whether the account is a member of the chat at this link */
  async isMember(link) {
    try {
      await this.core.client.invoke(
        new Api.channels.GetParticipant({
          channel: link.split("/").pop(),
          participant: new Api.InputPeerSelf(),
        }),
      );
      return true;
    } catch (error) {
      if (error.errorMessage === "USER_NOT_PARTICIPANT") return false;
      throw error;
    }
  }

  /** Join every required chat the account is not in */
  async ensureJoined() {
    for (const link of REQUIRED_CHATS) {
      if (await this.isMember(link)) continue;

      this.logger.warn(`Not in ${link}, joining`);
      await this.core.telegram.tryToJoin(link);
    }
  }
}
