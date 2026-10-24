import data from "./user_agents.json" with { type: "json" };

const userAgents = data;

const regularMobileUserAgents = [
  "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.8059.79 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.8059.39 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.8059.79 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.36 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.8059.39 Mobile Safari/537.36",
];

export { userAgents, regularMobileUserAgents };

export default userAgents;
