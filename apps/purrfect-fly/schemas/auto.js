import { FLIP_DIRECTION } from "../enums/flip-direction.js";
import { REQUALIFY_STRATEGY } from "../enums/requalify-strategy.js";
import { WALLET_PUSH_SCOPE } from "@purrfect/shared/enums/wallet-push-scope.js";
import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role.js";

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
      pushScope: { type: "string", enum: Object.values(WALLET_PUSH_SCOPE) },
    },
  },
};

/** One stored wallet named by public key and role, an account's also by its Telegram id */
const walletReferenceSchema = {
  type: "object",
  required: ["publicKey", "role"],
  properties: {
    publicKey: { type: "string", pattern: "^[0-9a-fA-F]{64}$" },
    role: { type: "string", enum: Object.values(WALLET_ROLE) },
    accountId: { type: "string", pattern: "^\\d+$" },
  },
  if: { properties: { role: { const: WALLET_ROLE.ACCOUNT } } },
  then: { required: ["publicKey", "role", "accountId"] },
};

/** Body of a wallet push, the Auto shape plus which wallets to store and the ones they replace */
export const autoWalletsPushSchema = {
  body: {
    ...autoSchema.body,
    required: [...autoSchema.body.required, "pushScope"],
    properties: {
      ...autoSchema.body.properties,
      replaces: { type: "array", items: walletReferenceSchema },
    },
  },
};

/** Body naming the Auto wallets to remove, an account's also names its Telegram id */
export const autoWalletsRemovalSchema = {
  body: {
    type: "object",
    required: ["auth", "wallets"],
    properties: {
      auth: { type: "string" },
      wallets: {
        type: "array",
        minItems: 1,
        items: walletReferenceSchema,
      },
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
