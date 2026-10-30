import MiaoushiBot from "./MiaoushiBot.js";
import MiaoushiChats from "./MiaoushiChats.js";
import MiaoushiEntry from "./MiaoushiEntry.js";
import MiaoushiIdentity from "./MiaoushiIdentity.js";
import MiaoushiMining from "./MiaoushiMining.js";
import MiaoushiStatus from "./MiaoushiStatus.js";
import MiaoushiTools from "./MiaoushiTools.js";

/** The modules a Miaoushi farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.identity = new MiaoushiIdentity(deps);
  ctx.bot = new MiaoushiBot(deps);
  ctx.chats = new MiaoushiChats(deps);
  ctx.entry = new MiaoushiEntry(deps);
  ctx.status = new MiaoushiStatus(deps);
  ctx.mining = new MiaoushiMining(deps);
  ctx.tools = new MiaoushiTools(deps);

  return Object.freeze(ctx);
}
