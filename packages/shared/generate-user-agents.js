import { writeFileSync } from "fs";

/** The brands phones are drawn from, each with the manufacturer its phones report (Redmi and POCO report Xiaomi) */
const BRAND_MANUFACTURERS = {
  samsung: "samsung",
  xiaomi: "Xiaomi",
  redmi: "Xiaomi",
  poco: "Xiaomi",
  google: "Google",
  oneplus: "OnePlus",
  motorola: "motorola",
  tecno: "TECNO",
  infinix: "INFINIX",
  itel: "ITEL",
  oppo: "OPPO",
  vivo: "vivo",
  realme: "realme",
  honor: "HONOR",
  huawei: "HUAWEI",
};

/** Names of devices that are not phones */
const NOT_A_PHONE =
  /chrome|\btv\b|television|watch|tablet|\btab\b|\bpad\b|box|stick|emulator|sdk|automotive|projector|glass|monitor|slate|pixelbook|nest|hub/i;

/** Samsung model codes from before the SM- era, and old carrier builds, too old for the Android versions drawn */
const OLD_SAMSUNG_MODEL = /^(SAMSUNG-|(GT|SCH|SGH|SHV|SPH|SHW|YP)-)/i;

/** Whether a listed device is a phone worth reporting */
function isPhone(model, name) {
  return (
    !NOT_A_PHONE.test(`${model} ${name}`) && !OLD_SAMSUNG_MODEL.test(model)
  );
}

/** The manufacturer as Telegram prints it: first letter upper case, the rest lower case */
function capitalizeFirst(text) {
  return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

async function generateUserAgents(count = 5000) {
  console.log("Fetching device list from GitHub...");

  const res = await fetch(
    "https://raw.githubusercontent.com/bsthen/device-models/main/devices.json",
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const devicesData = await res.json();
  const allModels = [];

  for (const [model, details] of Object.entries(devicesData)) {
    const manufacturer = BRAND_MANUFACTURERS[details.brand.toLowerCase()];

    if (manufacturer && isPhone(model, details.name)) {
      allModels.push(`${capitalizeFirst(manufacturer)} ${model}`);
    }
  }

  /* Android version → SDK (weighted toward 14/15) */
  const androidVersions = [
    { version: "11", sdk: 30, weight: 2 },
    { version: "12", sdk: 31, weight: 5 },
    { version: "13", sdk: 33, weight: 15 },
    { version: "14", sdk: 34, weight: 30 },
    { version: "15", sdk: 35, weight: 28 },
    { version: "16", sdk: 36, weight: 15 },
    { version: "17", sdk: 37, weight: 5 },
  ];

  /* Chrome for Android stable builds */
  const chromeVersions = ["153.0.8010.36", "155.0.8059.39", "155.0.8059.79"];

  /* Telegram versions */
  const telegramVersions = ["12.5.2", "13.0.0", "13.0.1", "13.1.0"];

  /* Performance class, as Telegram reports it */
  const qualities = ["HIGH", "HIGH", "HIGH", "AVERAGE"];

  /* Helpers */
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const weightedRandAndroid = () => {
    const total = androidVersions.reduce((s, v) => s + v.weight, 0);
    let r = Math.random() * total;
    for (const v of androidVersions) {
      r -= v.weight;
      if (r <= 0) return v;
    }
    return androidVersions.at(-1);
  };

  const buildUA = (model, av, chrome, tg, quality) =>
    `Mozilla/5.0 (Linux; Android ${av.version}; K) ` +
    `AppleWebKit/537.36 (KHTML, like Gecko) ` +
    `Chrome/${chrome} Mobile Safari/537.36 ` +
    `Telegram-Android/${tg} ` +
    `(${model}; Android ${av.version}; SDK ${av.sdk}; ${quality})`;

  /* Generation loop */
  const seen = new Set();
  const maxAttempts = count * 15;
  let attempts = 0;

  while (seen.size < count && attempts++ < maxAttempts) {
    const ua = buildUA(
      rand(allModels),
      weightedRandAndroid(),
      rand(chromeVersions),
      rand(telegramVersions),
      rand(qualities),
    );

    if (!seen.has(ua)) {
      seen.add(ua);
    }
  }

  console.log(`Generated ${seen.size} unique user agents`);
  return Array.from(seen.values());
}

/* Entry point */
const COUNT = parseInt(process.argv[2]) || 1000;
console.log(`Generating ${COUNT} user agents...\n`);

const agents = await generateUserAgents(COUNT);

writeFileSync("resources/user_agents.json", JSON.stringify(agents, null, 2));
console.log("Saved → user_agents.json");

writeFileSync("resources/user_agents.txt", agents.join("\n"));
console.log("Saved → user_agents.txt");
