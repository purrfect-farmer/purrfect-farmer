const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class MetaLottFarmer extends BaseFarmer {
  static id = "meta-lott";
  static origin = "https://www.metalott.com";
  static shouldSetAuth = true;

  getExtraHeaders() {
    return {
      ["Encryption"]: "0",
    };
  }

  async setAuth() {
    /** User */
    const user = this.farmer.initDataUnsafe.user;

    /** Get Access Token */
    const accessToken = await this.api
      .post(
        "https://www.metalott.com/core/app/auth/login",
        new URLSearchParams({
          tgUserId: user.id,
          username: user.username || "",
        })
      )
      .then((res) => res.data.result);

    /** Set Headers */
    return this.farmer.setHeaders({
      ["Authorization"]: accessToken,
      ["X-Access-Token"]: accessToken,
    });
  }

  async process() {
    const signInStatus = await this.api
      .post("https://www.metalott.com/core/app/signIn/signStatus")
      .then((res) => res.data.result);

    if (signInStatus === "FALSE") {
      await this.api.post("https://www.metalott.com/core/app/signIn/do");
    }
  }
};
