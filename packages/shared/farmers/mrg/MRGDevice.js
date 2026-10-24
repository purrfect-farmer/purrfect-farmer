import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { SAMSUNG_MODELS, TELEGRAM_PLATFORM } from "./constants.js";
import { createDevice } from "../../lib/device/createDevice.js";

/** The phone the account runs on, as the page fingerprints it */
export default class MRGDevice extends FarmerModule {
  /** The account's phone, the same on every run, whose `deviceId` stands in for the page's `mrg_device_id` */
  get() {
    return (this.device ||= createDevice(
      this.core.userId(),
      this.core.userAgent,
      { prefix: "mrg-device" },
    ));
  }

  /** The device the page reports alongside sign-in, as `mn()` builds it from the same phone the forensics describe */
  info() {
    const { profile } = this.get();
    const userAgent = this.core.userAgent || "";

    return {
      platform: TELEGRAM_PLATFORM,
      deviceName: this.getDeviceName(userAgent, TELEGRAM_PLATFORM),
      ram: profile.ram ? `${profile.ram} GB` : "Unknown",
      cpuCores: profile.cpu || 0,
      screenResolution: `${profile.screen.w}x${profile.screen.h}`,
      userAgent,
      timezone: profile.tz || "",
      language: this.core.telegramUser()?.["language_code"] || profile.locale,
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
}
