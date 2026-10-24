import { DEFAULT_WEB_APP_VERSION } from "../../utils/telegram.js";
import { getBrands } from "../userAgent/clientHints.js";
import alea from "seedrandom/lib/alea.js";

/** Android phones the profile is drawn from, as Telegram's WebView reports them */
const PHONES = [
  {
    model: "Pixel 7",
    android: "14",
    w: 412,
    h: 915,
    dpr: 2.625,
    gpu: ["ARM", "Mali-G710 MC10"],
    gl: "8192,8192,16,15",
    cpu: 8,
    ram: 8,
  },
  {
    model: "Pixel 8",
    android: "15",
    w: 412,
    h: 915,
    dpr: 2.625,
    gpu: ["ARM", "Mali-G715 MC7"],
    gl: "8192,8192,16,15",
    cpu: 9,
    ram: 8,
  },
  {
    model: "SM-A546B",
    android: "14",
    w: 384,
    h: 854,
    dpr: 2.8125,
    gpu: ["ARM", "Mali-G68 MC4"],
    gl: "8192,8192,16,15",
    cpu: 8,
    ram: 8,
  },
  {
    model: "SM-S918B",
    android: "14",
    w: 384,
    h: 824,
    dpr: 2.8125,
    gpu: ["Qualcomm", "Adreno (TM) 740"],
    gl: "16384,16384,32,31",
    cpu: 8,
    ram: 8,
  },
  {
    model: "SM-A155F",
    android: "14",
    w: 384,
    h: 854,
    dpr: 2.8125,
    gpu: ["ARM", "Mali-G57 MC2"],
    gl: "8192,8192,16,15",
    cpu: 8,
    ram: 4,
  },
  {
    model: "23129RAA4G",
    android: "14",
    w: 393,
    h: 873,
    dpr: 2.75,
    gpu: ["ARM", "Mali-G57 MC2"],
    gl: "8192,8192,16,15",
    cpu: 8,
    ram: 4,
  },
  {
    model: "2201117TG",
    android: "13",
    w: 393,
    h: 873,
    dpr: 2.75,
    gpu: ["Qualcomm", "Adreno (TM) 610"],
    gl: "16384,16384,32,31",
    cpu: 8,
    ram: 4,
  },
  {
    model: "CPH2591",
    android: "14",
    w: 360,
    h: 800,
    dpr: 3,
    gpu: ["Qualcomm", "Adreno (TM) 710"],
    gl: "16384,16384,32,31",
    cpu: 8,
    ram: 8,
  },
  {
    model: "RMX3710",
    android: "14",
    w: 393,
    h: 852,
    dpr: 2.75,
    gpu: ["ARM", "Mali-G57 MC2"],
    gl: "8192,8192,16,15",
    cpu: 8,
    ram: 8,
  },
  {
    model: "TECNO KI5q",
    android: "13",
    w: 360,
    h: 804,
    dpr: 2,
    gpu: ["ARM", "Mali-G52"],
    gl: "8192,8192,16,15",
    cpu: 8,
    ram: 4,
  },
  {
    model: "Infinix X6831",
    android: "13",
    w: 360,
    h: 800,
    dpr: 2,
    gpu: ["ARM", "Mali-G52 MC2"],
    gl: "8192,8192,16,15",
    cpu: 8,
    ram: 4,
  },
];

/** Values an audio fingerprint lands on across Chrome builds */
const AUDIO_SUMS = ["124.043475", "124.043476", "124.046743", "124.080345"];


/** Telegram's header and status bar, which the WebView's height loses */
const TG_CHROME_HEIGHT = 80;

/** The math fingerprint, the same in every V8 */
const MATH = [
  Math.tan(-1e300),
  Math.sinh(1),
  Math.expm1(1),
  Math.cbrt(100),
  Math.log1p(10),
]
  .map((value) => value.toPrecision(15))
  .join(",");

const pick = (random, list) => list[Math.floor(random() * list.length)];
const between = (random, min, max) =>
  min + Math.floor(random() * (max - min + 1));
const hex = (random, length) =>
  Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join("");

/** The model and Android version a Telegram user agent names, so the profile agrees with it */
function readTelegramDevice(userAgent) {
  const match = String(userAgent).match(
    /Telegram-Android\/[\d.]+ \(\S+ (.+); Android (\d+)/,
  );

  return match ? { model: match[1], android: match[2] } : {};
}

/** The host's time zone and locale, which a phone in the same place would share */
function readLocale() {
  try {
    const { timeZone, locale } = Intl.DateTimeFormat().resolvedOptions();

    return { tz: timeZone || "UTC", locale: locale || "en-US" };
  } catch {
    return { tz: "UTC", locale: "en-US" };
  }
}

/** A stable Android Telegram profile for one account, the same phone in every drop and page */
export function createDevice(seed, userAgent = "") {
  const random = alea(`device:${seed}`);
  const phone = { ...pick(random, PHONES), ...readTelegramDevice(userAgent) };
  const { tz, locale } = readLocale();
  const language = locale.split("-")[0];
  const height = phone.h - TG_CHROME_HEIGHT - between(random, 0, 24);
  const dpr = Math.round(phone.dpr * 100) / 100;

  const profile = {
    deviceId: `${hex(random, 8)}-${hex(random, 4)}-4${hex(random, 3)}-${(8 + between(random, 0, 3)).toString(16)}${hex(random, 3)}-${hex(random, 12)}`,
    screen: {
      w: phone.w,
      h: phone.h,
      aw: phone.w,
      ah: phone.h,
      dpr,
      depth: 24,
    },
    viewport: { w: phone.w, h: height },
    orientation: "portrait-primary",
    tz,
    tzOffset: new Date().getTimezoneOffset(),
    locale,
    langs: language === "en" ? locale : `${locale},${language},en-US,en`,
    cpu: phone.cpu,
    ram: phone.ram,
    touch: 5,
    platform: "Linux aarch64",
    vendor: "Google Inc.",
    cookies: true,
    pdf: false,
    dnt: null,
    plugins: 0,
    webdriver: false,
    webgl: `${phone.gpu[0]} / ${phone.gpu[1]}`,
    webglParams: phone.gl,
    canvas: hex(random, 32),
    audio: pick(random, AUDIO_SUMS),
    math: MATH,
    media: { mic: 1, cam: between(random, 1, 2), out: 1 },
    ua: {
      brands: getBrands(userAgent).map(
        ({ brand, version }) => `${brand} ${version}`,
      ),
      mobile: true,
      platform: "Android",
      model: phone.model,
      platformVersion: `${phone.android}.0.0`,
      arch: "",
      bitness: "",
    },
    quotaMb: between(random, 8000, 60000),
    net: {
      type: random() < 0.6 ? "wifi" : "cellular",
      eff: "4g",
      rtt: between(random, 1, 6) * 25,
      down: Math.round((1.5 + random() * 8.5) * 40) / 40,
      save: false,
    },
    tgPlatform: "android",
    tgVersion: DEFAULT_WEB_APP_VERSION,
    tgScheme: random() < 0.7 ? "dark" : "light",
    tgFullscreen: false,
    tgViewport: height,
    standalone: false,
    iframe: false,
  };

  /** How long the withdraw form is filled, and how many edits it takes */
  const formMs = between(random, 4000, 15000);
  const edits = between(random, 1, 3);
  const history = between(random, 1, 3);
  const startedAt = Date.now();

  return {
    profile,

    /** The unrounded `devicePixelRatio` the phone's browser reports */
    devicePixelRatio: phone.dpr,

    /** The login summary, as Victor's page builds it in `OA()` */
    getLoginDevice() {
      return {
        platform: profile.tgPlatform,
        tgVersion: profile.tgVersion,
        screen: `${phone.w}x${phone.h}@${dpr}`,
        ram: profile.ram,
        cpu: profile.cpu,
      };
    },

    /** The withdrawal fingerprint, as Victor's page builds it in `$A()` and MRG's sends it */
    getForensics() {
      return {
        ...profile,
        formMs,
        appMs:
          Date.now() - startedAt + formMs + between(Math.random, 20000, 90000),
        edits,
        visible: "visible",
        focus: true,
        history,
      };
    },
  };
}
