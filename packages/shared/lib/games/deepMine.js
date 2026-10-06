/** Victor's Deep Mine rules, as the mini app's demo backend mirrors the server */
export const DEEP_MINE = {
  width: 9,
  depth: 40,
  layerRows: 8,
  safeRows: 2,
  bagCap: 1.25,
  bustKeep: 0.5,
  dailyWinCap: 150,
};

/** Hardness, treasure multiplier, hazard rate per mille and the damage of each hazard kind */
export const LAYERS = [
  { name: "Topsoil", hard: 1, mult: 1.2, hazard: 30, damage: 1 },
  { name: "Clay", hard: 2, mult: 2.2, hazard: 55, damage: 1 },
  { name: "Stone", hard: 3, mult: 3.4, hazard: 80, damage: 1 },
  { name: "Granite", hard: 4, mult: 4.8, hazard: 105, damage: 1.33 },
  { name: "Magma", hard: 6, mult: 7.6, hazard: 135, damage: 1.5 },
];

/** Gear prices, the layer each tool profits in, from a simulation of the rules */
export const TOOLS = {
  shovel: { cost: 25, power: 1, energy: 25, targetLayer: 0 },
  pickaxe: { cost: 44, power: 2, energy: 30, targetLayer: 1 },
  drill: { cost: 55, power: 3, energy: 32, targetLayer: 2 },
};

/** The tools tried in order, the most profitable first */
const TOOL_PREFERENCE = ["drill", "pickaxe"];

/** The server's coin multiplier on top of the layer's */
const COIN_FACTOR = 0.77;

/** Average base coins of each loot tier, and the tier odds per 10000 */
const LOOT_TIERS = [
  { p: 0, coins: 0 },
  { p: 5500, coins: 1 },
  { p: 1800, coins: 3 },
  { p: 90, coins: 7.5 },
  { p: 8, coins: 19 },
  { p: 2, coins: 57.5 },
];

/** Average base coins of a cell that holds no hazard */
const EXPECTED_BASE_COINS = LOOT_TIERS.reduce(
  (sum, tier) => sum + (tier.p / 10000) * tier.coins,
  0,
);

/** How often a crack shows over a hazard, and over a safe block */
const CRACK_ON_HAZARD = 0.45;
const CRACK_ON_SAFE = 0.12;

/** Coins a lost heart is weighed at */
const HEART_PENALTY = 2;

/** The fewest closed blocks a bomb is spent on */
const MINIMUM_BOMB_BLOCKS = 3;

/** The layer a row sits in */
export function getLayerIndex(y) {
  return Math.min(LAYERS.length - 1, Math.floor(y / DEEP_MINE.layerRows));
}

/** Energy a block takes to break */
export function getDigCost(y, boulder, power) {
  return Math.ceil((LAYERS[getLayerIndex(y)].hard * (boulder ? 2 : 1)) / power);
}

/** Odds a block hides a hazard, from its layer and whether it shows a crack */
export function getHazardChance(y, crack) {
  if (y < DEEP_MINE.safeRows) return 0;

  const rate = LAYERS[getLayerIndex(y)].hazard / 1000;
  const onHazard = crack ? CRACK_ON_HAZARD : 1 - CRACK_ON_HAZARD;
  const onSafe = crack ? CRACK_ON_SAFE : 1 - CRACK_ON_SAFE;

  return (rate * onHazard) / (rate * onHazard + (1 - rate) * onSafe);
}

/** Coins a block is expected to give, with a scanned block read exactly */
export function getCellValue(y, crack, scan = "-") {
  const scale = LAYERS[getLayerIndex(y)].mult * COIN_FACTOR;

  if (/^[0-5]$/.test(scan)) return LOOT_TIERS[Number(scan)].coins * scale;
  if (/^[abc]$/.test(scan)) return 0;

  return (1 - getHazardChance(y, crack)) * EXPECTED_BASE_COINS * scale;
}

/** The best tool a balance pays for */
export function pickTool(balance) {
  return (
    TOOL_PREFERENCE.find((tool) => Number(balance) >= TOOLS[tool].cost) || null
  );
}

/** The most a run can win over its gear price */
export function getMaximumProfit(tool) {
  return TOOLS[tool].cost * (DEEP_MINE.bagCap - 1);
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

      cells.push({
        x,
        y,
        open: run.open[i] === "1",
        boulder: run.rock[i] === "1",
        crack: (Number(run.hint?.[i]) & 2) === 2,
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

/** The next move for a run: descend to the tool's layer, mine it while it pays, then climb out */
export function chooseMove(run) {
  const tool = TOOLS[run.tool] || TOOLS.drill;
  const energyRate = tool.cost / tool.energy;
  const targetRow = tool.targetLayer * DEEP_MINE.layerRows;
  const grid = readRun(run);
  const openCells = grid.cells.filter((cell) => cell.open);
  const deepest = openCells.reduce((max, cell) => Math.max(max, cell.y), -1);
  const descending = deepest < targetRow;
  const items = run.items || {};

  if (!descending && run.hearts <= 1) return { action: "end" };

  /** A found scanner shows what lies around the deepest tunnel */
  if (!descending && items.scanner > 0) {
    const cell = openCells.find((item) => item.y === deepest);

    return { action: "scanner", x: cell.x, y: cell.y };
  }

  /** A found bomb breaks the most blocks it can, for free */
  if (!descending && items.bomb > 0) {
    const best = openCells
      .filter((cell) => cell.y >= targetRow)
      .map((cell) => ({ ...cell, count: countBlastable(grid, cell.x, cell.y) }))
      .sort((a, b) => b.count - a.count)[0];

    if (best && best.count >= MINIMUM_BOMB_BLOCKS) {
      return { action: "bomb", x: best.x, y: best.y };
    }
  }

  let best = null;
  let bestScore = -Infinity;

  for (const cell of grid.cells) {
    if (!grid.canDig(cell.x, cell.y)) continue;

    const cost = getDigCost(cell.y, cell.boulder, tool.power);

    if (cost > run.energy) continue;

    const hazardChance = /^[abc]$/.test(cell.scan)
      ? 1
      : /^[0-5]$/.test(cell.scan)
        ? 0
        : getHazardChance(cell.y, cell.crack);

    let score;

    if (descending) {
      score = cell.y * 10 - cost * 3 - hazardChance * 30;
    } else {
      if (getLayerIndex(cell.y) < tool.targetLayer) continue;

      const damage = LAYERS[getLayerIndex(cell.y)].damage;
      const value =
        getCellValue(cell.y, cell.crack, cell.scan) -
        cost * energyRate -
        hazardChance * damage * HEART_PENALTY;

      score = value / cost;
    }

    if (score > bestScore) {
      bestScore = score;
      best = cell;
    }
  }

  if (!best || (!descending && bestScore <= 0)) return { action: "end" };

  return { action: "dig", x: best.x, y: best.y };
}
