import BaseFarmer from "../lib/BaseFarmer.js";

export default class KuoalaFarmer extends BaseFarmer {
  static id = "kuoala";
  static title = "Kuoala";
  static emoji = "🐨";
  static host = "app-live.kuoala.net";
  static domains = ["app-live.kuoala.net", "api-live.kuoala.net"];
  static telegramLink = "https://t.me/KuoalaBot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      config.url = this.updateUrl(config.url);

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  updateUrl(url) {
    const urlObj = new URL(url);
    urlObj.searchParams.set("user_id", this.getUserId());

    return urlObj.toString();
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/KuoalaBot?start=${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return { auth: btoa(this.telegramWebApp.initData) };
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.auth,
    };
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .post(
        "https://api-live.kuoala.net/user/check",
        {
          user_id: this.getUserId(),
          username: this.getUsername(),
          name: this.getUserFullName(),
          referrer_id: 0,
        },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Balance */
  getBalance(signal = this.signal) {
    return this.api
      .get("https://api-live.kuoala.net/reward/balance", { signal })
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUser();
    const balance = await this.getBalance();

    this.logUserInfo(user, balance);
    await this.claimDailyReward();
    await this.completeTasks();
    await this.completeVideos();
  }

  /** Log User Info */
  logUserInfo(user, balance) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", balance.balance);
  }

  /** Get Daily Reward */
  getDailyReward(signal = this.signal) {
    return this.api
      .get("https://api-live.kuoala.net/reward/daily-reward", { signal })
      .then((res) => res.data);
  }

  /** Collect Daily Reward */
  collectDailyReward(signal = this.signal) {
    return this.api
      .post("https://api-live.kuoala.net/reward/daily-reward", null, { signal })
      .then((res) => res.data);
  }

  /** Claim Daily Reward */
  claimDailyReward() {
    return this.executeTask("Claim Daily Reward", async () => {
      const dailyReward = await this.getDailyReward();

      if (!dailyReward["received_today"]) {
        await this.collectDailyReward();
        this.logger.success("Daily reward collected successfully");
      } else {
        this.logger.warn("Daily reward already claimed today");
      }
    });
  }

  /** Get Tasks */
  getTasks(signal = this.signal) {
    return this.api
      .get("https://api-live.kuoala.net/task", { signal })
      .then((res) => res.data.tasks || []);
  }

  getTaskPlatform(url) {
    return url.includes("youtube.com")
      ? "youtube"
      : url.includes("instagram.com")
      ? "instagram"
      : url.includes("x.com")
      ? "X"
      : url.includes("t.me")
      ? "telegram"
      : "unknown";
  }

  doTask(task, signal = this.signal) {
    return this.api
      .post(
        `https://api-live.kuoala.net/task/did/${task.id}`,
        { ...task, platform: this.getTaskPlatform(task.url) },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Videos */
  getVideos(signal = this.signal) {
    return this.api
      .get("https://api-live.kuoala.net/video?with_inactives=false", { signal })
      .then((res) => res.data.videos || []);
  }

  /** Watch Video */
  watchVideo(video, signal = this.signal) {
    return this.api
      .post(
        `https://api-live.kuoala.net/video/watched?video_id=${video.id}`,
        { ...video, platform: this.getTaskPlatform(video.url) },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Complete Tasks */
  completeTasks() {
    return this.executeTask("Complete Tasks", async () => {
      const tasks = await this.getTasks();
      const availableTasks = tasks.filter(
        (task) => !task["meta_data"]["user_did_task"]
      );

      if (availableTasks.length === 0) {
        this.logger.warn("No tasks available");
        return;
      }

      for (const task of availableTasks) {
        this.logger.newline();
        if (this.signal?.aborted) {
          this.logger.warn("Task processing aborted");
          return;
        }
        try {
          /** Do the task */
          await this.tryToJoinTelegramLink(task.url);
          await this.doTask(task);

          /** Log Task Completion */
          this.logger.success(`Task completed: ${task.title}`);

          /** Delay to avoid hitting API limits */
          await this.utils.delayForSeconds(1);
        } catch (error) {
          this.logger.error(
            `Failed to complete task: ${task.title} - ${error.message}`
          );
        }
      }
    });
  }

  /** Complete Videos */
  completeVideos() {
    return this.executeTask("Complete Videos", async () => {
      const videos = await this.getVideos();
      const availableVideos = videos.filter(
        (video) =>
          !video["user_meta_data"]["is_watched"] ||
          !video["user_meta_data"]["is_quiz_passed"]
      );

      if (availableVideos.length === 0) {
        this.logger.warn("No videos available");
        return;
      }

      for (const video of availableVideos) {
        this.logger.newline();
        if (this.signal?.aborted) {
          this.logger.warn("Video processing aborted");
          return;
        }
        try {
          /** Watch the video */
          await this.watchVideo(video);

          /** Log Video Completion */
          this.logger.success(`Video watched: ${video.title}`);

          /** Complete the quiz */
          this.logger.newline();
          this.logger.log(`Completing quiz for video: ${video.title}`);
          await this.completeQuiz(video.id);

          /** Delay to avoid hitting API limits */
          await this.utils.delayForSeconds(1);
        } catch (error) {
          this.logger.error(
            `Failed to watch video: ${video.title} - ${error.message}`
          );
        }
      }
    });
  }

  /** Get Quiz */
  getQuiz(videoId, signal = this.signal) {
    return this.api
      .get(`https://api-live.kuoala.net/video/${videoId}?get_quiz=true`, {
        signal,
      })
      .then((res) => res.data.video);
  }

  /** Submit Answer */
  submitAnswer(videoId, questionId, answerId, signal = this.signal) {
    return this.api
      .post(
        `https://api-live.kuoala.net/video/quiz/${videoId}`,
        {
          answers: [
            {
              ["question_id"]: questionId,
              ["answer_id"]: answerId,
            },
          ],
        },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Complete Quiz */
  async completeQuiz(videoId) {
    const { quiz } = await this.getQuiz(videoId);

    for (const question of quiz.questions) {
      const correctAnswer = question.answers.find(
        (answer) => answer["is_correct"] === true
      );

      await this.submitAnswer(videoId, question.id, correctAnswer.id);
    }
  }
}
