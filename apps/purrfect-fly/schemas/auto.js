import { FLIP_DIRECTION } from "../enums/flip-direction.js";
import { REQUALIFY_STRATEGY } from "../enums/requalify-strategy.js";

/** Body of an Auto operation */
export const autoSchema = {
  body: {
    type: "object",
    required: ["auth", "password", "master", "accounts"],
    properties: {
      /** Core properties */
      auth: { type: "string" },
      password: { type: "string" },
      master: { type: "object" },
      accounts: { type: "array" },

      /** Configs */
      delay: { type: "number" },
      difference: { type: "number" },
      amount: { type: "string" },
      retainMin: { type: "string" },
      retainMax: { type: "string" },
      minCollect: { type: "string" },
      freeze: { type: "boolean" },
      includeFrozen: { type: "boolean" },
      includeRevoked: { type: "boolean" },
      withdrawAfterBoost: { type: "boolean" },
      reuseLastAmount: { type: "boolean" },
      retainFunds: { type: "boolean" },
      onlyConnectWallet: { type: "boolean" },
      requalify: { type: "string", enum: Object.values(REQUALIFY_STRATEGY) },
      ignorePending: { type: "boolean" },
      runFarmer: { type: "boolean" },
      repeat: { type: "boolean" },
      repeatInterval: { type: "number" },
      assistInterval: { type: "number" },
      cultivateInterval: { type: "number" },
      trustedWithdrawDirectly: { type: "boolean" },
      trustedAssist: { type: "boolean" },
      flipDirection: { type: "string", enum: Object.values(FLIP_DIRECTION) },
      flipAfterBoost: { type: "boolean" },
      requesters: { type: "array" },
      slippage: { type: "string" },
      referralAddress: { type: "string" },
    },
  },
};

/** Body naming one managed account */
export const autoFarmerSchema = {
  body: {
    type: "object",
    required: ["auth", "account"],
    properties: {
      auth: { type: "string" },
      account: { type: "string" },
    },
  },
};
