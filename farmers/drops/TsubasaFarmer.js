const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class TsubasaFarmer extends BaseFarmer {
  static id = "tsubasa";
  static origin = "https://web.app.ton.tsubasa-rivals.com";

  constructor(config, farmer) {
    super(config, farmer);
    this.api.interceptors.response.use((response) => {
      if (response.data["master_hash"]) {
        this.masterHash = response.data["master_hash"];
      }
      return response;
    });
  }
  getExtraHeaders() {
    return {
      "X-Masterhash": this.masterHash ?? "",
      "X-Player-Id": this.farmer.account.id,
    };
  }

  async process() {
    const auth = await this.api
      .post("https://api.app.ton.tsubasa-rivals.com/api/start", {
        ["initData"]: this.farmer.initData,
        ["lang_code"]: this.farmer.initDataUnsafe.user["language_code"],
      })
      .then((res) => res.data);

    const user = auth["game_data"]["user"];
    const lastUpdate = auth["user_daily_reward"]["last_update"];

    if (!utils.dateFns.isToday(lastUpdate * 1000)) {
      await this.api.post(
        "https://api.app.ton.tsubasa-rivals.com/api/daily_reward/claim",
        { initData: this.farmer.initData }
      );
    }

    if (!this.config.options.upgradeCards) return;
    const balance = user["total_coins"];
    const friendCount = auth["friend_count"];

    /** All Cards */
    const allCards = auth["card_info"].reduce(
      (result, category) =>
        result.concat(
          category["card_list"].map((card) => ({
            ...card,
            ["next_profit_per_hour_difference"]:
              this.getNextCardPphDifference(card),
            ["category_id"]: category["category_id"],
            ["category_name"]: category["category_name"],
          }))
        ),
      []
    );

    /** Upgradable Cards */
    const availableCards = allCards.filter(
      (card) => card["cost"] <= balance && this.validateCardEndTime(card)
    );

    /** Unlocked Cards */
    const unlockedCards = availableCards.filter(
      (card) =>
        card["unlocked"] ||
        this.validateCardUnlock(availableCards, card, friendCount)
    );

    /** Upgradable Cards */
    const upgradableCards = unlockedCards
      .filter((card) => this.validateCardAvailability(card))
      .sort((a, b) => {
        return (
          b["next_profit_per_hour_difference"] -
          a["next_profit_per_hour_difference"]
        );
      });

    /** Level Zero Cards */
    const levelZeroCards = upgradableCards.filter(
      (item) => item["level"] === 0
    );

    /** Required Cards */
    const requiredCards = upgradableCards.filter((item) =>
      availableCards.some(
        (card) =>
          item["id"] === card["unlock_card_id"] &&
          item["level"] < card["unlock_card_level"]
      )
    );

    /** Choose Collection */
    const collection = levelZeroCards.length
      ? levelZeroCards
      : requiredCards.length
      ? requiredCards
      : upgradableCards;

    /** Pick Random Card */
    const card = utils.randomItem(collection);

    if (card) {
      await this.api.post(
        "https://api.app.ton.tsubasa-rivals.com/api/card/levelup",
        {
          ["card_id"]: card.id,
          ["category_id"]: card.category,
          ["initData"]: this.farmer.initData,
        }
      );
    }
  }

  /** Get Card Next PPH Difference */
  getNextCardPphDifference(card) {
    if (card["next_profit_per_hour"]) {
      return card["next_profit_per_hour"] - card["profit_per_hour"];
    } else {
      return 0;
    }
  }

  /** Validate Card Availability */
  validateCardAvailability(card) {
    return (
      card["level_up_available_date"] === null ||
      utils.dateFns.isAfter(
        new Date(),
        new Date(card["level_up_available_date"] * 1000)
      )
    );
  }

  /** Validate Card Time */
  validateCardEndTime(card) {
    return (
      card["end_datetime"] === null ||
      utils.dateFns.isBefore(new Date(), new Date(card["end_datetime"] * 1000))
    );
  }

  /** Validate Card Unlock  */
  validateCardUnlock(list, card, friendCount) {
    return (
      card["unlock_card_id"] === null ||
      card["unlock_card_level"] <=
        (card["unlock_card_id"] === "Friend"
          ? friendCount
          : list.find((item) => item["id"] === card["unlock_card_id"])?.[
              "level"
            ])
    );
  }
};
