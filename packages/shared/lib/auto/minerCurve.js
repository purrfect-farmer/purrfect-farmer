/** The miner speed curve MRG and Victor's Company share: 0.2 TH/s at level 1, 7.56 at 203, 5000 at 1000 */

/** The highest level the drops sell */
export const MAXIMUM_MINER_LEVEL = 1000;

const BASE_SPEED_THS = 0.2;
const MID_SPEED_LEVEL = 203;
const MID_SPEED_THS = 7.56;
const MAXIMUM_SPEED_THS = 5000;

/** Tokens mined per day, per TH/s */
const DAILY_OUTPUT_PER_THS = 25;

/** What level 1 mines per day */
const LEVEL_ONE_DAILY_OUTPUT = 5;

/** The mining speed, in TH/s, a level runs at */
export function getMinerSpeed(level) {
  if (level <= 0) return 0;
  if (level >= MAXIMUM_MINER_LEVEL) return MAXIMUM_SPEED_THS;

  if (level <= MID_SPEED_LEVEL) {
    const step = (MID_SPEED_THS - BASE_SPEED_THS) / (MID_SPEED_LEVEL - 1);

    return Number((BASE_SPEED_THS + (level - 1) * step).toFixed(2));
  }

  const progress =
    (level - MID_SPEED_LEVEL) / (MAXIMUM_MINER_LEVEL - MID_SPEED_LEVEL);

  return Number(
    (
      MID_SPEED_THS +
      (MAXIMUM_SPEED_THS - MID_SPEED_THS) * Math.pow(progress, 2.1)
    ).toFixed(2),
  );
}

/** The tokens a level mines per day */
export function getMinerDailyOutput(level) {
  if (level <= 0) return 0;
  if (level === 1) return LEVEL_ONE_DAILY_OUTPUT;

  return Number((getMinerSpeed(level) * DAILY_OUTPUT_PER_THS).toFixed(2));
}

/** The holding a level is unlocked with, priced the way both drops price it */
export function getMinerRequiredHolding(level) {
  if (level <= 0) return 0;
  if (level === 1) return 100;
  if (level >= MAXIMUM_MINER_LEVEL) return 3875968992;

  if (level <= 203) {
    return Math.round(100 + 9900 * Math.pow((level - 1) / 202, 1.8));
  }

  if (level <= 450) {
    return Math.round(1e4 + 24e4 * Math.pow((level - 203) / 247, 2));
  }

  if (level <= 650) {
    return Math.round(25e4 + 26881780 * Math.pow((level - 450) / 200, 2.2));
  }

  if (level <= 850) {
    return Math.round(
      27131780 + 321705420 * Math.pow((level - 650) / 200, 2.5),
    );
  }

  return Math.round(
    348837200 +
      3527131792 * Math.pow((level - 850) / (MAXIMUM_MINER_LEVEL - 850), 2.6),
  );
}

/** The highest level a holding covers, with a connected wallet granting level 1 for free */
export function findMinerLevelForHolding(holding, walletConnected = true) {
  const amount = Number(holding) || 0;

  if (!walletConnected && amount <= 0) return 0;
  if (amount < getMinerRequiredHolding(1)) {
    return walletConnected ? 1 : 0;
  }

  let lowestLevel = 1;
  let highestLevel = MAXIMUM_MINER_LEVEL;
  let reachable = 1;

  while (lowestLevel <= highestLevel) {
    const middleLevel = Math.floor((lowestLevel + highestLevel) / 2);

    if (amount >= getMinerRequiredHolding(middleLevel)) {
      reachable = middleLevel;
      lowestLevel = middleLevel + 1;
    } else {
      highestLevel = middleLevel - 1;
    }
  }

  return reachable;
}
