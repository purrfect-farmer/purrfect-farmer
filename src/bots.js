import path from "path-browserify";

export const botIconsGlob = import.meta.glob("@/assets/images/bots/*.png", {
  eager: true,
  import: "default",
  query: {
    format: "webp",
    w: "80",
    h: "80",
  },
});

export const botIcons = Object.fromEntries(
  Object.entries(botIconsGlob).map(([k, v]) => {
    return [path.parse(k).name, v];
  })
);

const bots = [
  {
    title: "Notgram",
    icon: botIcons["notgram"],
    telegramLink: "https://t.me/notgram_game_bot?start=r1147265290",
    miniAppUrl: "https://notgramgame.fun",
    shouldClickLaunchButton: true,
  },
  {
    title: "Paws",
    icon: botIcons["paws"],
    telegramLink: "https://t.me/PAWSOG_bot/PAWS?startapp=5MwPEyav",
  },
  {
    title: "W-Coin",
    icon: botIcons["w-coin"],
    telegramLink: "https://t.me/wcoin_tapbot?start=MTE0NzI2NTI5MA==",
    miniAppUrl: "https://app.w-coin.io",
    shouldClickLaunchButton: true,
  },
  {
    title: "Sidekick Fans",
    icon: botIcons["sidekick"],
    telegramLink: "https://t.me/sidekick_fans_bot?start=1147265290",
    miniAppUrl: "https://game.sidekick.fans",
    shouldClickLaunchButton: true,
  },
  {
    title: "Units Wallet",
    icon: botIcons["units"],
    telegramLink:
      "https://t.me/UnitsWallet_bot/UnitsWallet?startapp=0x48a0C00214b40d95Bb60f2eC8cd8d1e7B5a7b45E",
  },
  {
    title: "DuckChain",
    icon: botIcons["duck-chain"],
    telegramLink: "https://t.me/DuckChain_bot/quack?startapp=egJgBrxV",
  },
  {
    title: "Seed",
    icon: botIcons["seed"],
    telegramLink: "https://t.me/seed_coin_bot/app?startapp=1147265290",
  },
  {
    title: "Tada",
    icon: botIcons["tada"],
    telegramLink: "https://t.me/TADA_Ride_Bot/join?startapp=ref_lUIJ4eM-AV",
  },
];

export default bots;
