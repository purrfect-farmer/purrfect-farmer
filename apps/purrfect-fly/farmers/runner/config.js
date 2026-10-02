import { getFarmerEnvPrefix } from "../../config/env-schema.js";
import logger from "../../lib/logger.js";

/** Ban trigger count */
export const BAN_TRIGGER_COUNT = env("BAN_TRIGGER_COUNT", 10);

/** Concurrent accounts */
export const MAX_CONCURRENT_ACCOUNTS = env("MAX_CONCURRENT_ACCOUNTS", 20);

/** Max retries for rate-limited (429) requests */
export const API_MAX_RETRY_COUNT = env("API_MAX_RETRY_COUNT", 10);

/** Base delay (ms) for retry backoff */
export const API_RETRY_BASE_DELAY = env("API_RETRY_BASE_DELAY", 1000);

/**
 * Resolve the farmer's runner settings from the environment
 * @param {import("@purrfect/shared/lib/BaseFarmer.js").default} FarmerClass
 */
export function resolveRunnerConfig(FarmerClass) {
  /** Environment Variables key */
  const FARMER_ENV_BASE_KEY = getFarmerEnvPrefix(FarmerClass.id);

  /** Get Environment Variable */
  const getFarmerEnv = (key, defaultValue) => {
    return env(FARMER_ENV_BASE_KEY + "_" + key, defaultValue);
  };

  /** Default referrer mode */
  const defaultReferrerMode = env("DEFAULT_REFERRER_MODE", "single");
  const farmerReferrerMode = getFarmerEnv("REFERRER_MODE", defaultReferrerMode);

  /** Farmer primary account ID */
  const farmerPrimaryAccountId = getFarmerEnv(
    "PRIMARY_ACCOUNT_ID",
    env("PRIMARY_ACCOUNT_ID"),
  );

  return {
    /** Is Farmer Enabled */
    enabled: getFarmerEnv("ENABLED", FarmerClass.enabled),

    /** Is Farmer Auto-Started */
    autoStart: getFarmerEnv("AUTO_START", FarmerClass.autoStart),

    /** Skip execution of new accounts */
    skipExecutionOfNewAccount: getFarmerEnv(
      "SKIP_EXECUTION_OF_NEW_ACCOUNT",
      FarmerClass.skipExecutionOfNewAccount,
    ),

    /** Interval */
    interval: getFarmerEnv("INTERVAL", FarmerClass.interval),

    /** Telegram message thread */
    threadId:
      getFarmerEnv("THREAD_ID", "") || env("TELEGRAM_FARMING_THREAD_ID", ""),

    /** Telegram bot link */
    telegramLink: getFarmerEnv("LINK", FarmerClass.telegramLink),

    /** Referrer mode */
    referrerMode: farmerReferrerMode || FarmerClass.referrerMode,

    /** Primary account ID */
    primaryAccountId: Number(farmerPrimaryAccountId) || 0,
  };
}

/** Log the resolved runner settings */
export function logRunnerConfig(FarmerClass, config) {
  logger.success(`${FarmerClass.title} Farmer`);
  logger.keyValue("Enabled", config.enabled);
  logger.keyValue("Auto-Start", config.autoStart);
  logger.keyValue("Telegram link", config.telegramLink);
  logger.keyValue("Thread ID", config.threadId);
  logger.keyValue("Referrer mode", config.referrerMode);
  logger.keyValue("Interval", config.interval);
  logger.keyValue(
    "Skip execution of new accounts",
    config.skipExecutionOfNewAccount,
  );
  logger.keyValue("Primary account ID", config.primaryAccountId, {
    format: false,
  });

  /** Primary account is required */
  if (!config.primaryAccountId) {
    logger.warn("Primary account ID is not configured!");
  }

  logger.newline();
}
