import Pbf from "pbf";

/**
 * Write Create Session
 * @param {import("pbf").default} pbf
 * @param {object} option
 */
export function writeCreateSession(pbf, option) {
  option.mapgen_ver && pbf.writeVarintField(1, option.mapgen_ver),
    option.config_ver && pbf.writeVarintField(2, option.config_ver),
    option.used_boosters && pbf.writePackedVarint(3, option.used_boosters);
}

/**
 * Read Session
 * @param {import("pbf").default} pbf
 */
export function readSession(pbf) {
  return pbf.readFields(readSessionField, {
    ["id"]: 0,
    ["outer_seed"]: [],
    ["inner_seed"]: [],
    ["multiplier"]: 0,
    ["highest_score"]: 0,
    ["excluded_presets"]: [],
    ["total_score_event"]: 0,
    ["highest_score_event"]: 0,
    ["ton_event_allowed_amount_of_coins"]: 0,
    ["ton_event_coin_value"]: 0,
    ["trump_event_allowed_amount_of_coins"]: 0,
    ["trump_event_coin_value"]: 0,
    ["ton_coin_values"]: [],
    ["ton_spawn_positions"]: [],
    ["used_boosters"]: [],
    ["custom_coin_type"]: 0,
    ["custom_coin_values"]: [],
    ["custom_coin_spawn_positions"]: [],
    ["dynamic_coin_type"]: 0,
    ["dynamic_coin_values"]: [],
    ["dynamic_coin_spawn_positions"]: [],
  });
}

/**
 * Read Session Field
 * @param {import("pbf").default} pbf
 */
export function readSessionField(tag, result, pbf) {
  tag === 1
    ? (result["id"] = pbf.readVarint())
    : tag === 2
    ? result["outer_seed"].push(pbf.readString())
    : tag === 3
    ? result["inner_seed"].push(pbf.readString())
    : tag === 4
    ? (result["multiplier"] = pbf.readVarint())
    : tag === 5
    ? (result["highest_score"] = pbf.readVarint())
    : tag === 6
    ? pbf.readPackedVarint(result["excluded_presets"])
    : tag === 100
    ? (result["total_score_event"] = pbf.readVarint(true))
    : tag === 101
    ? (result["highest_score_event"] = pbf.readVarint(true))
    : tag === 102
    ? (result["ton_event_allowed_amount_of_coins"] = pbf.readVarint(true))
    : tag === 103
    ? (result["ton_event_coin_value"] = pbf.readVarint(true))
    : tag === 104
    ? (result["trump_event_allowed_amount_of_coins"] = pbf.readVarint(true))
    : tag === 105
    ? (result["trump_event_coin_value"] = pbf.readVarint(true))
    : tag === 300
    ? pbf.readPackedVarint(result["ton_coin_values"])
    : tag === 301
    ? pbf.readPackedVarint(result["ton_spawn_positions"])
    : tag === 400
    ? pbf.readPackedVarint(result["used_boosters"])
    : tag === 500
    ? (result["custom_coin_type"] = pbf.readVarint())
    : tag === 501
    ? pbf.readPackedVarint(result["custom_coin_values"])
    : tag === 502
    ? pbf.readPackedVarint(result["custom_coin_spawn_positions"])
    : tag === 503
    ? (result["dynamic_coin_type"] = pbf.readVarint())
    : tag === 504
    ? pbf.readPackedVarint(result["dynamic_coin_values"])
    : tag === 505 &&
      pbf.readPackedVarint(result["dynamic_coin_spawn_positions"]);
}

/**
 * Get Session
 * @param {Uint8Array} buffer
 * @returns
 */
export function getSession(buffer) {
  const update = new Pbf(buffer);
  const result = readSession(update);

  const session = {
    id: result["id"],
    outerSeed: [
      BigInt(result["outer_seed"][0]),
      BigInt(result["outer_seed"][1]),
    ],
    innerSeed: [
      BigInt(result["inner_seed"][0]),
      BigInt(result["inner_seed"][1]),
    ],
    multiplier: result["multiplier"] === 0 ? 1 : result["multiplier"],
    highestScore: result["highest_score"],
    totalScoreEvent: result["total_score_event"],
    highestScoreEvent: result["highest_score_event"],
    excludedPresets: result["excluded_presets"] ?? [],
    tonCoinValues: result["ton_coin_values"] ?? [],
    tonSpawnPositions: result["ton_spawn_positions"] ?? [],
    customCoinType: result["custom_coin_type"],
    customCoinValues: result["custom_coin_values"] ?? [],
    customSpawnPositions: result["custom_coin_spawn_positions"] ?? [],
    remainingBeginnerTonAllocation: result["remaining_beginner_ton_allocation"],
    usedBoosters: result["used_boosters"] ?? [],
    dynamicCoinType: result["dynamic_coin_type"],
    dynamicCoinValues: result["dynamic_coin_values"] ?? [],
    dynamicCoinSpawnPositions: result["dynamic_coin_spawn_positions"] ?? [],
  };

  return session;
}

/**
 * Write Sessison Update
 * @param {import("pbf").default} pbf
 * @param {object} session
 */
export function writeSessionUpdate(pbf, session) {
  if ((session.id && pbf.writeVarintField(1, session.id), session.chunks))
    for (const i of session.chunks) pbf.writeMessage(2, writeChunkUpdate, i);
  session.score && pbf.writeVarintField(10, session.score);
}

/**
 * Write Chunk Update
 * @param {object} chunk
 * @param {import("pbf").default} pbf
 */
export function writeChunkUpdate(chunk, pbf) {
  if ((chunk.index && pbf.writeVarintField(1, chunk.index), chunk.entities))
    for (const i of chunk.entities) pbf.writeMessage(2, writeEntityUpdate, i);
}

/**
 * Write Entity Update
 * @param {object} entity
 * @param {import("pbf").default} pbf
 */
export function writeEntityUpdate(entity, pbf) {
  entity.update_type && pbf.writeVarintField(1, entity.update_type),
    entity.entity_index && pbf.writeVarintField(2, entity.entity_index),
    entity.position_x && pbf.writeFloatField(3, entity.position_x),
    entity.position_y && pbf.writeFloatField(4, entity.position_y),
    entity.time && pbf.writeVarintField(5, entity.time);
}
