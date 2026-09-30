import AssistOperation from "./auto/operations/AssistOperation.js";
import AutoContext from "./auto/AutoContext.js";
import BoostOperation from "./auto/operations/BoostOperation.js";
import CollectOperation from "./auto/operations/CollectOperation.js";
import CultivateOperation from "./auto/operations/CultivateOperation.js";
import FlipOperation from "./auto/operations/FlipOperation.js";
import LoadOperation from "./auto/operations/LoadOperation.js";
import RescueOperation from "./auto/operations/RescueOperation.js";
import SingleOperation from "./auto/operations/SingleOperation.js";
import StatusOperation from "./auto/operations/StatusOperation.js";
import WithdrawOperation from "./auto/operations/WithdrawOperation.js";
import logger from "./logger.js";
import { readSnapshots } from "./auto/AutoRecords.js";
import { summarizeVault } from "./AutoVault.js";

/** The static entry points the routes call; each drop subclasses this with its own descriptor (see autos.js) */
class BaseAuto {
  /** @type {string} id of the farmer this drop farms */
  static farmerId = null;

  /** @type {string} id of the auto itself, e.g. "atf-auto" */
  static id = null;

  /** @type {string} human-readable name, e.g. "ATF Auto" */
  static title = null;

  /** @type {string} token symbol used in notifications, e.g. "ATF" */
  static token = null;

  /** @type {string} jetton master address moved by boost/collect */
  static jettonAddress = null;

  /** @type {Map<number, AutoContext>} redeclared per subclass so drops run concurrently for one user */
  static instances = new Map();

  /** @type {Map<string, AutoContext>} the assist loop, keyed by drop and kept out of the single-flight slot */
  static assistInstances = new Map();

  /** @type {Map<string, AutoContext>} the cultivate loop, keyed by drop and running alongside the assist one */
  static cultivateInstances = new Map();

  /** Run in the slot `key` holds in `map`, refusing while another run holds it */
  static runExclusive(map, key, options, run) {
    if (map.has(key)) {
      return map.get(key).notify.sendPendingOperation();
    }

    const ctx = new AutoContext(this, options);

    map.set(key, ctx);

    run(ctx)
      .catch((error) => logger.error(error.message || "Unknown error!"))
      .finally(() => {
        /** Resume terminated accounts back into farming batches */
        ctx.resumeTerminatedAccounts();
        map.delete(key);
      });
  }

  /** Run an operation in the operator's single-flight slot */
  static execute(options, Operation) {
    this.runExclusive(this.instances, options.id, options, (ctx) =>
      new Operation(ctx).run(),
    );
  }

  static cancel({ id }) {
    this.instances.get(id)?.cancel();
  }

  static boost(options) {
    this.execute(options, BoostOperation);
  }

  static collect(options) {
    this.execute(options, CollectOperation);
  }

  static withdraw(options) {
    this.execute(options, WithdrawOperation);
  }

  static flip(options) {
    this.execute(options, FlipOperation);
  }

  static rescue(options) {
    this.execute(options, RescueOperation);
  }

  static status(options) {
    this.execute(options, StatusOperation);
  }

  static load(options) {
    this.execute(options, LoadOperation);
  }

  /** Single-account operations run outside the single-flight slot and resolve with their result */
  static singleBoost(options) {
    return new SingleOperation(new AutoContext(this, options)).boost();
  }

  static singleCollect(options) {
    return new SingleOperation(new AutoContext(this, options)).collect();
  }

  /** Start the assist loop for this drop, keyed by drop and outside the slot `execute` reserves */
  static assist(options) {
    this.runExclusive(this.assistInstances, this.id, options, (ctx) =>
      new AssistOperation(ctx).run(),
    );
  }

  static cancelAssist() {
    const ctx = this.assistInstances.get(this.id);

    ctx?.cancel();

    return Boolean(ctx);
  }

  static assistStatus() {
    const ctx = this.assistInstances.get(this.id);

    return {
      running: Boolean(ctx),
      startedAt: ctx?.startedAt || null,
      interval: ctx?.options.assistInterval || null,
      trustedWithdrawDirectly: Boolean(ctx?.options.trustedWithdrawDirectly),
      trustedAssist: Boolean(ctx?.options.trustedAssist),
      vault: summarizeVault(this.id),
    };
  }

  /** Start the cultivate loop for this drop, keyed by drop and running alongside the assist one */
  static cultivate(options) {
    this.runExclusive(this.cultivateInstances, this.id, options, (ctx) =>
      new CultivateOperation(ctx).run(),
    );
  }

  static cancelCultivate() {
    const ctx = this.cultivateInstances.get(this.id);

    ctx?.cancel();

    return Boolean(ctx);
  }

  static cultivateStatus() {
    const ctx = this.cultivateInstances.get(this.id);

    return {
      running: Boolean(ctx),
      startedAt: ctx?.startedAt || null,
      interval: ctx?.options.cultivateInterval || null,
      vault: summarizeVault(this.id),
    };
  }

  /** What every account this server farms for the drop last looked like, from the stored snapshots */
  static snapshots() {
    return readSnapshots(this.farmerId);
  }
}

export default BaseAuto;
