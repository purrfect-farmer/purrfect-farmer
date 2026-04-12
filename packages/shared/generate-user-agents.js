import { writeFileSync } from "fs";

async function generateUserAgents(count = 5000) {
  console.log("Fetching device list from GitHub...");

  const res = await fetch(
    "https://raw.githubusercontent.com/bsthen/device-models/main/devices.json",
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const SUPPORTED_BRANDS = ["Google", "Samsung", "Tecno", "Xiaomi", "OnePlus"];
  const devicesData = await res.json();
  const allModels = [];

  for (const [model, details] of Object.entries(devicesData)) {
    if (SUPPORTED_BRANDS.includes(details.brand)) {
      allModels.push(`${details.brand} ${model}`);
    }
  }

  /* Android version → SDK (weighted toward 13/14) */
  const androidVersions = [
    { version: "11", sdk: 30, weight: 3 },
    { version: "12", sdk: 32, weight: 8 },
    { version: "13", sdk: 33, weight: 22 },
    { version: "14", sdk: 34, weight: 42 },
    { version: "15", sdk: 35, weight: 20 },
    { version: "16", sdk: 36, weight: 5 },
  ];

  /* Chrome minor builds */
  const chromeVersions = [
    "129.0.6635.90",
    "129.0.6635.101",
    "130.0.6667.75",
    "130.0.6667.95",
    "130.0.6667.121",
    "131.0.6778.112",
    "131.0.6778.120",
    "131.0.6778.135",
    "132.0.6834.79",
    "132.0.6834.163",
    "133.0.6943.121",
    "133.0.6943.134",
    "134.0.6998.99",
    "134.0.6998.135",
    "135.0.7049.100",
    "135.0.7049.111",
    "136.0.7103.60",
    "136.0.7103.78",
    "146.0.7680.177",
  ];

  /* Telegram versions */
  const telegramVersions = [
    "11.5.3",
    "11.6.1",
    "11.7.0",
    "11.8.1",
    "12.0.0",
    "12.1.0",
    "12.2.1",
    "12.3.0",
    "12.4.1",
    "12.5.2",
  ];

  /* Quality flag */
  const qualities = ["HIGH", "HIGH", "HIGH", "MEDIUM"];

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
