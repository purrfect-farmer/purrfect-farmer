import { CronJob } from "cron";

class CronRunner {
  constructor(mode = "sequential") {
    this.mode = mode;
    this.jobs = [];
    this.running = false;
  }

  register(interval, callback, name = "") {
    this.jobs.push({
      interval,
      callback: this.wrapCallback(callback, name),
      name,
    });
  }

  wrapCallback(callback, name) {
    return async () => {
      try {
        console.log(`▶️ Starting: ${name}`);
        await callback();
        console.log(`✅ Finished: ${name}`);
      } catch (err) {
        console.error(`❌ Error in ${name}:`, err);
      }
    };
  }

  async runner() {
    if (this.running) {
      console.warn(
        "⏳ Previous sequential job still running. Skipping this run."
      );
      return;
    }

    this.running = true;
    console.log(
      "🔁 Sequential run triggered at",
      new Date().toLocaleTimeString()
    );

    for (const job of this.jobs) {
      await job.callback();
    }

    console.log("🏁 Sequential run completed");
    this.running = false;
  }

  start() {
    if (this.mode === "sequential") {
      console.log("⏱ Running in sequential mode");
      new CronJob("*/10 * * * *", this.runner.bind(this), null, true);
    } else {
      console.log("⏱ Running in concurrent mode");
      this.jobs.forEach((job) => {
        new CronJob(job.interval, this.wrapConcurrent(job), null, true);
      });
    }
  }

  wrapConcurrent(job) {
    let running = false;
    return async () => {
      if (running) {
        console.warn(`⏳ Skipping overlapping job: ${job.name}`);
        return;
      }

      running = true;
      try {
        await job.callback();
      } finally {
        running = false;
      }
    };
  }
}

export default CronRunner;
