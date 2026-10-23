/** The game's backend, served from the mini app's own origin */
export const API_URL = "https://lets.playmonsterland.com/api";

/** Bot the referral links point at */
export const BOT_USERNAME = "monsterland_bot";

/** Cloudflare Turnstile guarding every API call, as the page renders it */
export const TURNSTILE_SITE_KEY = "0x4AAAAAADdQlvzwXRHPB_GW";

export const TURNSTILE_PAGE_URL = "https://lets.playmonsterland.com/";

export const TURNSTILE_HEADER = "cf-turnstile-response";

/** The errors the backend answers a 403 with */
export const TURNSTILE_REQUIRED = "TURNSTILE_REQUIRED";

export const BANNED = "BANNED";

/** Ad networks the page loads, as its ad config declares them */
export const ADSGRAM_BLOCK_ID = "37686";

export const MONETAG_ZONE_ID = "11057880";

export const GIGAPUB_PROJECT_ID = "7583";

export const TADS_WIDGET_ID = "11616";

/** Providers the farmer can play, the rest are reported failed so the backend falls back */
export const PLAYABLE_AD_PROVIDERS = ["adsgram", "monetag", "gigapub", "tads"];

/** How the page waits on an ad's server side settlement */
export const AD_RESULT_POLL_SECONDS = 2.5;

export const AD_RESULT_TIMEOUT_SECONDS = 60;

export const MONETAG_COMPLETE_ATTEMPTS = 40;

export const MONETAG_COMPLETE_INTERVAL_SECONDS = 0.5;

/** Vitals decay per hour, before personality modifiers */
export const DECAY_RATES = { food: 20, hygiene: 12.5, energy: 50 / 3 };

/** Personalities that bend decay, and the hygiene floor a pristine monster keeps */
export const DECAY_MODIFIERS = {
  zoomer: { energy: 1.5 },
  athlete: { energy: 0.5 },
  royal: { hygiene: 0.7 },
};

export const PRISTINE_HYGIENE_FLOOR = 50;

/** Where each vital is topped up to, enough to stay above the penalty lines across a 3h gap */
export const VITAL_TARGETS = { food: 100, hygiene: 70, energy: 85 };

/** Most items used on one vital in one pass */
export const MAXIMUM_ITEMS_PER_VITAL = 6;

/** Vital items, cheapest first, with the ads they cost when ads can pay for them */
export const VITAL_ITEMS = {
  food: [
    { id: "magic_apple", value: 15, price: 250, ads: 1 },
    { id: "fairy_berries", value: 30, price: 800, ads: 2 },
    { id: "dragon_steak", value: 50, price: 4500, ads: 0 },
    { id: "royal_feast", value: 100, price: 15000, ads: 0 },
    /** A buff, not a restore: no food decay for `buffHours`, its 5 ads a per-item sequence kept 7 days */
    { id: "hunger_potion", value: 0, price: 28000, ads: 5, buffHours: 6 },
  ],
  hygiene: [
    { id: "magic_towel", value: 20, price: 200, ads: 1 },
    { id: "fairy_bath", value: 40, price: 700, ads: 2 },
    { id: "royal_spa", value: 70, price: 4000, ads: 0 },
    { id: "crystal_shower", value: 100, price: 12000, ads: 0 },
  ],
  energy: [
    { id: "wizard_coffee", value: 20, price: 300, ads: 1 },
    { id: "spark_juice", value: 40, price: 1000, ads: 2 },
    { id: "thunder_tea", value: 70, price: 5000, ads: 0 },
    { id: "phoenix_elixir", value: 100, price: 18000, ads: 0 },
  ],
};

/** A hunger potion is only worth it when it spares at least this many feeds */
export const HUNGER_POTION_MINIMUM_SAVED_FEEDS = 2;

/** Lumis never spent on vitals, so purchases cannot drain the balance */
export const LUMIS_RESERVE = 2000;

/** Sleep restores 25 energy an hour for up to 6 hours, and the game only allows it below 80 */
export const SLEEP_MAX_HOURS = 6;

export const SLEEP_ENERGY_PER_HOUR = 25;

export const SLEEP_ENERGY_THRESHOLD = 30;

/** Dreamers recover energy twice as fast while asleep */
export const DREAMER_SLEEP_MULTIPLIER = 2;

/** Monsters stop leveling at 25 */
export const MAXIMUM_LEVEL = 25;

/** Accounts cap at 10 monster slots, the second unlocked by watching 3 ads */
export const MAXIMUM_MONSTER_SLOTS = 10;

export const SLOT_2_ADS_REQUIRED = 3;

/** Lumis price of each slot past the second, by slot number */
export const MONSTER_SLOT_PRICES = {
  3: 25e3,
  4: 1e5,
  5: 25e4,
  6: 5e5,
  7: 15e5,
  8: 4e6,
  9: 1e7,
  10: 25e6,
};

/** Mystery eggs cost 50k lumis, rising 1.5x with each one bought, capped at 3M */
export const MYSTERY_EGG_BASE_PRICE = 5e4;

export const MYSTERY_EGG_PRICE_GROWTH = 1.5;

export const MYSTERY_EGG_MAXIMUM_PRICE = 3e6;

/** A purchase must pay itself back within this many days of a new monster's output */
export const GROW_PAYBACK_DAYS = 10;

/** A new monster starts at level 1 and is kept fed above 80, which pays 1.25x */
export const NEW_MONSTER_VITALS_MULTIPLIER = 1.25;

/** A monster this close to the end of its lifespan gets a spare egg lined up, since incubation takes a day */
export const REPLACEMENT_LEAD_HOURS = 36;

/** Most purchases in one pass */
export const MAXIMUM_PURCHASES_PER_PASS = 5;

/** Fragments a single egg takes */
export const FRAGMENTS_PER_EGG = 5;

/** Incubation ads an egg takes, by type */
export const INCUBATION_MAXIMUM_ADS = {
  mystery_egg: 10,
  golden_egg: 15,
  celestial_egg: 20,
};

export const EGG_TYPES = ["mystery_egg", "golden_egg", "celestial_egg"];

/** Monster lifespans: by the egg it hatched from, else by rarity */
export const DAY_MS = 864e5;

export const EGG_LIFESPAN_DAYS = {
  ancient_egg: 45,
  mystery_egg: 45,
  golden_egg: 75,
  celestial_egg: 95,
  arcane_egg: 55,
};

export const RARITY_LIFESPAN_DAYS = {
  common: 45,
  uncommon: 60,
  rare: 75,
  epic: 90,
  mythic: 100,
};

export const INFLUENCER_LIFESPAN_DAYS = 75;

/** Referral goal ids, which are the referral counts they unlock at */
export const REFERRAL_GOAL_IDS = [
  1, 3, 5, 10, 15, 25, 40, 50, 75, 100, 150, 200, 300, 500, 700,
];

/** Referrals the newcomer bonus egg takes */
export const INITIAL_BONUS_REFERRALS = 3;

/** Monster slots an account starts with */
export const DEFAULT_MONSTER_SLOTS = 1;

/** Mission board buckets and the page size the page uses */
export const MISSION_BUCKETS = ["official", "partners", "ads"];

export const MISSIONS_PAGE_SIZE = 20;

/** How long the page waits before it lets an honor mission be claimed */
export const MISSION_DWELL_SECONDS = 5;

/** Mission refusals that are not worth a warning */
export const MISSION_SKIP_REASONS = [
  "NOT_MEMBER",
  "ALREADY_CLAIMED",
  "NOT_COMPLETED",
];

/** Fallback minimum in lumis, used until the game's config has been read */
export const MINIMUM_WITHDRAWAL = 500000;

/** The page's fallback cap on one withdrawal, used when the config leaves it out */
export const MAXIMUM_WITHDRAWAL = 1e7;

/** Withdrawal statuses, as the payment history and its live updates report them */
export const SETTLED_WITHDRAWAL_STATUSES = ["completed"];

export const FLAGGED_WITHDRAWAL_STATUSES = ["failed", "denied"];

/** How many history rows are read when looking for withdrawals */
export const WITHDRAWAL_HISTORY_LIMIT = 10;
