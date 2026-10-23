import {
  API_URL,
  HUMAN_CHECK_REQUIRED_CODE,
  SAMSUNG_MODELS,
  TELEGRAM_PLATFORM,
} from "./constants.js";
import { createVictorsDevice } from "../../lib/games/victorsDevice.js";
import BaseFarmer from "../../lib/BaseFarmer.js";

/** API transport, device identity, sign-in and presence */
export default class MRGSession extends BaseFarmer {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on every call the drop's own API receives, and on no others */
  configureApi() {
    const initDataInterceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.data = {
          ...config.data,
          initData: this.getInitData(),
        };
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(initDataInterceptor);
    };
  }

  /** Call the drop's API, reading a refused action as a payload and passing the human check once if it is asked for */
  async callApi(path, data = {}, { retryHuman = true } = {}) {
    const response = await this.api.post(`${API_URL}${path}`, data, {
      signal: this.signal,
      validateStatus: (status) => status < 500,
    });

    const payload = response.data;

    if (typeof payload !== "object" || payload === null) {
      throw new Error(`Request failed (${response.status})`);
    }

    if (payload["code"] === HUMAN_CHECK_REQUIRED_CODE && retryHuman) {
      this.logger.warn("The human check has lapsed, passing it again.");
      await this.obtainHumanCheck();
      return this.callApi(path, data, { retryHuman: false });
    }

    return payload;
  }

  /** Act on the drop's API, returning a refusal as a payload */
  postToApi(path, data = {}) {
    return this.callApi(path, data);
  }

  /* --------------------------------------------------------------------- */
  /* Device                                                                */
  /* --------------------------------------------------------------------- */

  /** The account's phone, the same on every run, whose `deviceId` stands in for the page's `mrg_device_id` */
  getDevice() {
    return (this.device ||= createVictorsDevice(
      this.getUserId(),
      this.userAgent,
      { prefix: "mrg-device" },
    ));
  }

  /** The device the page reports alongside sign-in, as `mn()` builds it from the same phone the forensics describe */
  getDeviceInfo() {
    const { profile } = this.getDevice();
    const userAgent = this.userAgent || "";

    return {
      platform: TELEGRAM_PLATFORM,
      deviceName: this.getDeviceName(userAgent, TELEGRAM_PLATFORM),
      ram: profile.ram ? `${profile.ram} GB` : "Unknown",
      cpuCores: profile.cpu || 0,
      screenResolution: `${profile.screen.w}x${profile.screen.h}`,
      userAgent,
      timezone: profile.tz || "",
      language: this.getTelegramUser()?.["language_code"] || profile.locale,
    };
  }

  /** Name the device from its user agent, as the page's `ha()` does */
  getDeviceName(userAgent, fallback) {
    if (!userAgent) return fallback || "Unknown Device";
    if (/DBeaver/i.test(userAgent)) return "DBeaver DB Client";
    if (/DataGrip/i.test(userAgent)) return "DataGrip DB Client";
    if (/Metabase/i.test(userAgent)) return "Metabase Analytics";
    if (/Postman/i.test(userAgent)) return "Postman API Client";
    if (/Insomnia/i.test(userAgent)) return "Insomnia API Client";

    const samsung = userAgent.match(/SM-[A-Z0-9]+/i);

    if (samsung) {
      const code = samsung[0].toUpperCase();
      const name = SAMSUNG_MODELS.find(([codes]) =>
        codes.some((part) => code.includes(part)),
      )?.[1];

      return `Samsung ${name || "Galaxy"} (${code})`;
    }

    if (/Redmi/i.test(userAgent)) {
      const redmi = userAgent.match(
        /Redmi\s+([A-Za-z0-9\s]+?)(?=\s+Build|\s+\)|;)/i,
      );

      return redmi ? `Xiaomi ${redmi[0]}` : "Xiaomi Redmi";
    }

    if (/POCO/i.test(userAgent)) {
      const poco = userAgent.match(
        /POCO\s+([A-Za-z0-9\s]+?)(?=\s+Build|\s+\)|;)/i,
      );

      return poco ? `POCO ${poco[0]}` : "POCO Phone";
    }

    if (/iPhone/i.test(userAgent)) {
      const ios = userAgent.match(/OS\s+([0-9_]+)\s+like/i);

      return `Apple iPhone (${ios ? `iOS ${ios[1].replace(/_/g, ".")}` : "iOS"})`;
    }

    if (/iPad/i.test(userAgent)) return "Apple iPad";

    if (/Pixel/i.test(userAgent)) {
      const pixel = userAgent.match(
        /Pixel\s+([0-9a-zA-Z\s]+?)(?=\s+Build|\s+\)|;)/i,
      );

      return pixel ? `Google ${pixel[0]}` : "Google Pixel";
    }

    const android = userAgent.match(
      /Android\s+([0-9.]+);\s*([^;)]+?)(?=\s+Build|\))/i,
    );
    const model = android?.[2]?.trim();

    if (model && !model.includes("K") && model.length > 2) {
      return `${model} (Android ${android[1]})`;
    }

    if (/Windows/i.test(userAgent)) return "Windows PC";
    if (/Macintosh|Mac OS X/i.test(userAgent)) return "Apple Mac PC";
    if (/Linux/i.test(userAgent)) return "Linux Desktop";

    return fallback || "Mobile Device";
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  fetchAuth() {
    return this.verifyAccount();
  }

  /** Get Meta */
  fetchMeta() {
    return this.loadAccount();
  }

  /** Sign in and read the account */
  async login() {
    await this.verifyAccount();
    await this.loadAccount();

    /** The page reads these on load too, and their failure blocks nothing */
    await this.fetchPnlHistory().catch(() => null);

    return this.account_data;
  }

  /** Report presence without letting a failure stop the pass */
  async updatePresence(present) {
    try {
      await (present ? this.ping() : this.leavePresence());
    } catch (error) {
      this.logger.warn("Failed to update presence:", error.message);
    }
  }

  /** Get Referral Link */
  getReferralLink() {
    const referralCode = this.account_data?.user?.["referralCode"];

    return referralCode
      ? `https://t.me/mrgminerbot/app?startapp=ref_${referralCode}`
      : this.constructor.telegramLink;
  }
}
