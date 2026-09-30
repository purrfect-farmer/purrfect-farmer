import AutoOperation from "./AutoOperation.js";
import { setVault } from "../../AutoVault.js";

/**
 * Some drops only settle a withdrawal placed by a verified account, so a verified
 * account withdraws on an ordinary one's behalf by adopting its wallet for the length
 * of one withdrawal. Load hands this server the wallets, and assist runs that exchange
 * on a timer.
 */
class LoadOperation extends AutoOperation {
  /** Take an account's wallets, and act on nothing */
  async run() {
    const { ctx, fmt } = this;
    const accepted = [];
    const rejected = [];

    for (const account of ctx.accounts) {
      if (ctx.aborted) break;

      if (!account.userId) {
        rejected.push([account.title || account.address, "no Telegram user"]);
        continue;
      }

      /** A wallet is only useful alongside the session that owns it, so another server's account cannot be helped */
      const cloudAccount = await ctx.getCloudAccount(account, true);

      if (!cloudAccount) {
        rejected.push([
          fmt.formatAccountLink(account.userId),
          "not farmed by this server",
        ]);
        continue;
      }

      accepted.push(account);
    }

    setVault(ctx.autoId, {
      password: ctx.password,
      accounts: accepted,
    });

    const verified = accepted.filter((account) => account.verified);

    await this.notify.send([
      `📥 ${this.title} - Wallets loaded.`,
      fmt.formatKeyValue("Loaded", `${accepted.length}`),
      fmt.formatKeyValue("Verified", `${verified.length}`),
      ...verified.map((account) =>
        fmt.formatKeyValue(
          "✅",
          `${fmt.formatAccountLink(account.userId)} ${fmt.formatAddressLink(account.address)}`,
        ),
      ),
      ...rejected.map(([label, reason]) =>
        fmt.formatKeyValue("⏩", `${label} - <i>${reason}</i>`),
      ),
      `<i>Wallets are held in memory only and are lost when the server restarts.</i>`,
    ]);

    return { accepted: accepted.length, rejected: rejected.length };
  }
}

export default LoadOperation;
