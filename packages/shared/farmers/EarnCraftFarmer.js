import BaseFarmer from "../lib/BaseFarmer.js";

export default class EarnCraftFarmer extends BaseFarmer {
    static id = "earn-craft";
    static title = "Earn Craft";
    static emoji = "🌽";
    static host = "craftsssman.xyz";
    static domains = ["craftsssman.xyz"];
    static telegramLink = "https://t.me/EarnCraft_Robot?start=1147265290";
    static autoStart = false;
    static cacheAuth = false;
    static cacheTelegramWebApp = false;
    static rating = 4;
    static interval = "0 */2 * * *"; // Every 2 hours

    /** Get Referral Link */
    getReferralLink() {
        return `https://t.me/EarnCraft_Robot?start=${this.getUserId()}`;
    }

    /** Login */
    login(signal = this.signal) {
        return this.api
            .post(
                "https://craftsssman.xyz/api/auth/login",
                {
                    "initData": this.getInitData(),
                    "isTelegram": true,
                    "telegramId": this.getUserId(),
                    "telegramFirstName": this.getUserFirstName(),
                    "telegramLastName": this.getUserLastName(),
                    "telegramUsername": this.getUsername()
                },
                { signal },
            )
            .then((res) => res.data);
    }

    /** Get Settings */
    getSettings(signal = this.signal) {
        return this.api
            .get("https://craftsssman.xyz/api/settings", { signal })
            .then((res) => res.data);
    }

    /** Get Tasks */
    getTasks(signal = this.signal) {
        return this.api
            .get("https://craftsssman.xyz/api/tasks", { signal })
            .then((res) => res.data);
    }

    /** Get Ads */
    getAds(signal = this.signal) {
        return this.api
            .get("https://craftsssman.xyz/api/ads", { signal })
            .then((res) => res.data);
    }

    /** Get Completed Tasks */
    getCompletedTasks(signal = this.signal) {
        return this.api
            .get("https://craftsssman.xyz/api/completed-tasks", { signal })
            .then((res) => res.data);
    }

    /** Get Me */
    getMe(signal = this.signal) {
        return this.api
            .get("https://craftsssman.xyz/api/me", { signal })
            .then((res) => res.data);
    }


    /** Complete Task */
    completeTask(taskId, signal = this.signal) {
        return this.api
            .post("https://craftsssman.xyz/api/complete-task", { taskId }, { signal })
            .then((res) => res.data);
    }

    /** Watch Ad */
    watchAd(adId, signal = this.signal) {
        return this.api
            .post("https://craftsssman.xyz/api/watch-ad", { adId }, { signal })
            .then((res) => res.data);
    }

    /** Spin */
    spinWheel(signal = this.signal) {
        return this.api
            .post("https://craftsssman.xyz/api/spin", null, { signal })
            .then((res) => res.data);
    }

    /** Claim Bonus Ad Reward */
    claimBonusAdReward(signal = this.signal) {
        return this.api
            .post("https://craftsssman.xyz/api/bonus-ad-reward", {}, { signal })
            .then((res) => res.data);
    }


    /** Process Farmer */
    async process() {
        this.user = await this.login();
        this.settings = await this.getSettings();
        this.tasks = await this.getTasks();
        this.ads = await this.getAds();
        this.completedTasks = await this.getCompletedTasks();
        this.me = await this.getMe();

        this.logUserInfo(this.user);
        await this.executeTask("Tasks", () => this.completeTasks());
        await this.executeTask("Watch Ads", () => this.watchAds());
        await this.executeTask("Bonus Ads", () => this.claimBonusAds());
        await this.executeTask("Spin Wheel", () => this.spinToday());
    }

    logUserInfo(user) {
        this.logger.newline();
        this.logCurrentUser();
        this.logger.keyValue("Balance", `$${user.balance}`);
        this.logger.keyValue("Today Ads", `${user['ads_today']}`);
        this.logger.keyValue("Total Ads", `${user['ads_watched_total']}/4`);
        this.logger.keyValue("Bonus Ad Today", `${user['bonus_ad_today']}/10`);
        this.logger.keyValue("Invites", `${user['total_referrals']}/4`);
        this.logger.keyValue("Banned", user['is_banned'] ? "Yes 🚫" : "No ✅");
    }

    /** Complete tasks */
    async completeTasks() {

        /** Get Available Tasks */
        const availableTasks = this.tasks.filter(task => !this.completedTasks.includes(task.id));

        for (const task of availableTasks) {
            if (this.signal.aborted) break;

            /** Join Telegram Channel */
            if (task.type === "telegram") {
                await this.tryToJoinTelegramLink(`https://t.me/${task.link.replace("@", "")}`);
            }

            /** Complete Task */
            await this.completeTask(task.id);
            this.logger.success(`Completed task: ${task.title}`);
            await this.utils.delayForSeconds(20, { signal: this.signal });
        }
    }

    /** Watch ads */
    async watchAds() {
        /** Get Ads Progress */
        const adsProgress = JSON.parse(this.me['ad_progress']) || {};

        /** Get Available Ads */
        const availableAds = this.ads.filter(ad => {
            const count = adsProgress[`ad_${ad.id}_watched`] || 0;
            const reset = adsProgress[`ad_${ad.id}_reset`] || null;
            const hasReset = !reset || this.utils.dateFns.isAfter(new Date(), new Date(reset));

            return count < ad['limit_count'] || hasReset;
        });

        /** Watch Ads */
        for (const ad of availableAds) {
            if (this.signal.aborted) break;
            await this.watchAd(ad.id);
            this.logger.success(`Watched ad: ${ad.title}`);
            await this.utils.delayForSeconds(30, { signal: this.signal });
        }
    }

    /** Claim Bonus Ads */
    async claimBonusAds() {
        const bonusAdToday = this.me['bonus_ad_today'];
        const bonusAdDate = this.me['bonus_ad_date'];

        const hasReset = !bonusAdDate || this.utils.dateFns.isAfter(
            new Date(),
            this.utils.dateFns.addDays(new Date(bonusAdDate), 1)
        );

        for (let i = bonusAdToday; i < 10; i++) {
            if (this.signal.aborted) break;
            await this.claimBonusAdReward();
            this.logger.success(`Claimed bonus ad reward - (${i + 1}/10)`);
            await this.utils.delayForSeconds(30, { signal: this.signal });
        }
    }

    /** Spin Today */
    async spinToday() {
        const lastSpinTime = this.me['last_spin_time'];
        const canSpin = !lastSpinTime || this.utils.dateFns.isAfter(
            new Date(),
            this.utils.dateFns.addDays(new Date(lastSpinTime), 1)
        );

        if (canSpin) {
            await this.spinWheel();
            this.logger.success(`Spun wheel`);
        } else {
            this.logger.warn(`You have already spun the wheel today`);
        }
    }
}
