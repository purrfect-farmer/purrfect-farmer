/** Victor's Deep Mine rules, as the mini app's demo backend mirrors the server */
export const DEEP_MINE = {
  width: 9,
  depth: 40,
  layerRows: 8,
  safeRows: 2,
  hearts: 3,
  bagCap: 1.15,
  refundRate: 0.9,
};

/** Hardness, treasure multiplier, hazard rate per mille and the hazard kinds each layer draws from */
export const LAYERS = [
  { name: "Topsoil", hard: 1, mult: 1.05, hazard: 40, hazards: [1] },
  { name: "Clay", hard: 2, mult: 2, hazard: 75, hazards: [1, 2, 1, 2, 3] },
  { name: "Stone", hard: 3, mult: 2.8, hazard: 105, hazards: [1, 2, 3] },
  { name: "Granite", hard: 4, mult: 3.6, hazard: 135, hazards: [1, 2, 3] },
  { name: "Magma", hard: 6, mult: 5, hazard: 170, hazards: [2, 3] },
];

/** Hearts each hazard kind takes: rockfall, gas pocket, lava */
const HAZARD_DAMAGE = [0, 1, 1, 3];

/** Gear prices, and the deepest layer each tool is played in */
export const TOOLS = {
  shovel: { cost: 25, power: 1, energy: 25, targetLayer: 0 },
  pickaxe: { cost: 44, power: 2, energy: 30, targetLayer: 0 },
  drill: { cost: 55, power: 3, energy: 32, targetLayer: 0 },
};

/** Only the shovel in topsoil pays since busts keep nothing and lava kills deeper */
const TOOL_PREFERENCE = ["shovel"];

/** An energy drink's price, refunded with unused energy */
const DRINK_COST = 10;

/** The server's coin multiplier on top of the layer's, before the payout dial */
const COIN_FACTOR = 1.08;

/** Below this payout dial even the shovel loses (break-even is near 73) */
export const MINIMUM_PAYOUT_DIAL = 80;

/** Average base coins of each loot tier, and the tier odds per 10000 */
const LOOT_TIERS = [
  { p: 0, coins: 0 },
  { p: 5500, coins: 1 },
  { p: 1460, coins: 3 },
  { p: 90, coins: 7.5 },
  { p: 90, coins: 8.5 },
  { p: 30, coins: 19 },
];

/** Odds a hazard-free block holds loot, and its average base coins when it does */
const LOOT_CHANCE = LOOT_TIERS.reduce((sum, tier) => sum + tier.p, 0) / 10000;
const LOOT_BASE_COINS =
  LOOT_TIERS.reduce((sum, tier) => sum + tier.p * tier.coins, 0) /
  (LOOT_CHANCE * 10000);

/** How often a sparkle shows over loot and over anything else */
const SPARKLE_ON_LOOT = 0.26;
const SPARKLE_ON_OTHER = 0.22;

/** How often a crack shows over a hazard and over a safe block */
const CRACK_ON_HAZARD = 0.35;
const CRACK_ON_SAFE = 0.15;

/** Coins a heart lost without busting is weighed at */
const HEART_PENALTY = 2;

/** The fewest closed blocks a bomb is spent on */
const MINIMUM_BOMB_BLOCKS = 3;

const round1 = (value) => Math.round(value * 10) / 10;

/** The layer a row sits in */
export function getLayerIndex(y) {
  return Math.min(LAYERS.length - 1, Math.floor(y / DEEP_MINE.layerRows));
}

/** Energy a block takes to break */
export function getDigCost(y, boulder, power) {
  return Math.ceil((LAYERS[getLayerIndex(y)].hard * (boulder ? 2 : 1)) / power);
}

/** Coins per base coin a row pays at a payout dial */
function getCoinScale(y, dial) {
  return LAYERS[getLayerIndex(y)].mult * COIN_FACTOR * (dial / 100);
}

/** Odds a block hides a hazard and holds loot, from its row and both hints */
export function getCellOdds(y, crack, sparkle) {
  const rate = y < DEEP_MINE.safeRows ? 0 : LAYERS[getLayerIndex(y)].hazard / 1000;
  const crackOdds = (hazard) =>
    crack
      ? hazard
        ? CRACK_ON_HAZARD
        : CRACK_ON_SAFE
      : hazard
        ? 1 - CRACK_ON_HAZARD
        : 1 - CRACK_ON_SAFE;
  const sparkleOdds = (loot) =>
    sparkle
      ? loot
        ? SPARKLE_ON_LOOT
        : SPARKLE_ON_OTHER
      : loot
        ? 1 - SPARKLE_ON_LOOT
        : 1 - SPARKLE_ON_OTHER;

  const hazard = rate * crackOdds(true) * sparkleOdds(false);
  const loot = (1 - rate) * LOOT_CHANCE * crackOdds(false) * sparkleOdds(true);
  const empty =
    (1 - rate) * (1 - LOOT_CHANCE) * crackOdds(false) * sparkleOdds(false);
  const total = hazard + loot + empty;

  return { hazard: hazard / total, loot: loot / total };
}

/** The best tool a balance pays for */
export function pickTool(balance) {
  return (
    TOOL_PREFERENCE.find((tool) => Number(balance) >= TOOLS[tool].cost) || null
  );
}

/** The most a run can pay out, as the server rounds it */
function getPayoutCap(spent) {
  return round1(spent * DEEP_MINE.bagCap);
}

/** What climbing out refunds for unused energy and drinks */
function getRefund(tool, energy, drinks) {
  return round1(
    DEEP_MINE.refundRate *
      ((Math.min(Math.max(0, energy), tool.energy) * tool.cost) / tool.energy +
        Math.max(0, drinks) * DRINK_COST),
  );
}

/** The `cap` a fresh run with no extra gear reports, which changes whenever the cap or refund rules do */
export function getStartCap(toolName) {
  const tool = TOOLS[toolName];

  return Math.max(
    0,
    round1(getPayoutCap(tool.cost) - getRefund(tool, tool.energy, 0)),
  );
}

/** Read the run's strings into a grid helper */
function readRun(run) {
  const { width, depth } = DEEP_MINE;
  const index = (x, y) => y * width + x;
  const inside = (x, y) => x >= 0 && x < width && y >= 0 && y < depth;
  const isOpen = (x, y) => run.open[index(x, y)] === "1";

  const neighbours = (x, y) =>
    [
      [x, y - 1],
      [x, y + 1],
      [x - 1, y],
      [x + 1, y],
    ].filter(([nx, ny]) => inside(nx, ny));

  const canDig = (x, y) =>
    !isOpen(x, y) &&
    (y === 0 || neighbours(x, y).some(([nx, ny]) => isOpen(nx, ny)));

  const cells = [];

  for (let y = 0; y < depth; y++) {
    for (let x = 0; x < width; x++) {
      const i = index(x, y);
      const hint = Number(run.hint?.[i]) || 0;

      cells.push({
        x,
        y,
        open: run.open[i] === "1",
        boulder: run.rock[i] === "1",
        sparkle: (hint & 1) === 1,
        crack: (hint & 2) === 2,
        scan: run.scan?.[i] || "-",
      });
    }
  }

  return { index, inside, isOpen, canDig, cells };
}

/** Closed blocks around an open one, which a bomb would break */
function countBlastable(grid, x, y) {
  let count = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && grid.inside(x + dx, y + dy)) {
        count += grid.isOpen(x + dx, y + dy) ? 0 : 1;
      }
    }
  }

  return count;
}

/** Hazard odds, loot odds and coins if loot, with a scanned block read exactly */
function readCell(cell, dial) {
  const scale = getCoinScale(cell.y, dial);

  if (/^[abc]$/.test(cell.scan)) {
    return { hazard: 1, kind: "abc".indexOf(cell.scan) + 1, loot: 0, coins: 0 };
  }

  if (/^[0-5]$/.test(cell.scan)) {
    const tier = Number(cell.scan);

    return {
      hazard: 0,
      loot: tier ? 1 : 0,
      coins: LOOT_TIERS[tier].coins * scale,
    };
  }

  const odds = getCellOdds(cell.y, cell.crack, cell.sparkle);

  return { ...odds, coins: LOOT_BASE_COINS * scale };
}

/** The next move for a run: dig the block that raises the expected payout most, or climb out */
export function chooseMove(run, { dial = 100 } = {}) {
  const tool = TOOLS[run.tool] || TOOLS.shovel;
  const maxRow = (tool.targetLayer + 1) * DEEP_MINE.layerRows - 1;
  const grid = readRun(run);
  const items = run.items || {};
  const drinks = items.drink || 0;
  const payoutCap = getPayoutCap(run.spent ?? tool.cost);
  const refundPerEnergy = (DEEP_MINE.refundRate * tool.cost) / tool.energy;
  const quitValue = Math.min(
    run.bag + getRefund(tool, run.energy, drinks),
    payoutCap,
  );

  /** A found scanner shows what lies around the deepest tunnel */
  if (items.scanner > 0) {
    const cell = grid.cells
      .filter((item) => item.open && item.y <= maxRow)
      .sort((a, b) => b.y - a.y)[0];

    if (cell) return { action: "scanner", x: cell.x, y: cell.y };
  }

  /** A found bomb breaks blocks for free, and its blast takes no damage */
  if (items.bomb > 0) {
    const best = grid.cells
      .filter((cell) => cell.open && cell.y <= maxRow)
      .map((cell) => ({ ...cell, count: countBlastable(grid, cell.x, cell.y) }))
      .sort((a, b) => b.count - a.count)[0];

    if (best && best.count >= MINIMUM_BOMB_BLOCKS) {
      return { action: "bomb", x: best.x, y: best.y };
    }
  }

  let best = null;
  let bestScore = 0;

  for (const cell of grid.cells) {
    if (cell.y > maxRow || !grid.canDig(cell.x, cell.y)) continue;

    const cost = getDigCost(cell.y, cell.boulder, tool.power);

    if (cost > run.energy) continue;

    const { hazard, loot, coins, kind } = readCell(cell, dial);
    const kinds = kind ? [kind] : LAYERS[getLayerIndex(cell.y)].hazards;
    const lethal =
      kinds.filter((item) => HAZARD_DAMAGE[item] >= run.hearts).length /
      kinds.length;

    /** Running dry ends the run with the bag alone, so the spent energy is never refunded */
    const refundAfter =
      run.energy - cost > 0
        ? getRefund(tool, run.energy - cost, drinks)
        : drinks * DEEP_MINE.refundRate * DRINK_COST;
    const safeCoins = hazard < 1 ? (loot / (1 - hazard)) * coins : 0;
    const safeGain =
      Math.min(run.bag + safeCoins + refundAfter, payoutCap) - quitValue;
    const hitLoss =
      lethal * quitValue +
      (1 - lethal) * (cost * refundPerEnergy + HEART_PENALTY);

    const score = (1 - hazard) * safeGain - hazard * hitLoss;

    if (score > bestScore) {
      bestScore = score;
      best = cell;
    }
  }

  if (!best) return { action: "end" };

  return { action: "dig", x: best.x, y: best.y };
}
