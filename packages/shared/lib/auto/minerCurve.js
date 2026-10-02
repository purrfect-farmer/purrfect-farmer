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
