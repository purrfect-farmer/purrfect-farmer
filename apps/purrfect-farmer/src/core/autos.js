import bcrypt from "bcryptjs";
import path from "path-browserify";
import storage from "@/lib/storage";
import { customLogger } from "@/utils";
import tonLogo from "@/assets/images/toncoin-ton-logo.svg";
import {
  getAutoCurrency,
  isNativeAuto,
} from "@purrfect/shared/lib/auto/native.js";
import { encryption } from "@/services/encryption";
import { sharedStorageKey } from "@/lib/storageKeys";

/** Auto drops: wallet managers built on a farmer, opted into with `static auto` and iconed by auto id */
const farmersGlob = import.meta.glob(
  "../../node_modules/@purrfect/shared/farmers/*.js",
  {
    eager: true,
    import: "default",
  },
);

/** Indexes an icon glob by filename, so it can be looked up by id */
const indexIcons = (glob) =>
  Object.entries(glob).reduce((result, [filepath, icon]) => {
    result.set(path.basename(filepath, ".png"), icon);
    return result;
  }, new Map());

/** Tab icon, keyed by auto id */
const autoIcons = indexIcons(
  import.meta.glob("../assets/images/autos/*.png", {
    eager: true,
    import: "default",
    query: { w: 80, h: 80, format: "webp" },
  }),
);

/** Same icon at header size, keyed by auto id */
const autoLargeIcons = indexIcons(
  import.meta.glob("../assets/images/autos/*.png", {
    eager: true,
    import: "default",
    query: { w: 192, h: 192, format: "webp" },
  }),
);

/** The drop's token icon, reusing the farmer's icon keyed by farmer id */
const tokenIcons = indexIcons(
  import.meta.glob(
    "../../node_modules/@purrfect/shared/assets/images/farmers/*.png",
    {
      eager: true,
      import: "default",
      query: { w: 32, h: 32, format: "webp" },
    },
  ),
);

const autos = Object.values(farmersGlob)
  .filter((Farmer) => Farmer.auto)
  .map((Farmer) => {
    /** A native Auto moves TON, so its token is TON's own logo */
    const native = isNativeAuto(Farmer.auto);

    return {
      ...Farmer.auto,
      native,
      currency: getAutoCurrency(Farmer.auto),
      farmerId: Farmer.id,
      icon: autoIcons.get(Farmer.auto.id),
      largeIcon: autoLargeIcons.get(Farmer.auto.id),
      tokenIcon: native ? tonLogo : tokenIcons.get(Farmer.id),
    };
  });

const autosMap = autos.reduce((result, auto) => {
  result.set(auto.id, auto);
  return result;
}, new Map());

/** The storage keys holding a drop's wallets, shared by the Auto tab and the import flow */
export function autoStateKeys(config) {
  return {
    master: `${config.storagePrefix}-master`,
    accounts: `${config.storagePrefix}-accounts`,
  };
}

/** The Autos holding wallets, read straight out of storage with the farmer's own Auto ranked first */
export function getAutoWalletSources(farmerId) {
  return autos
    .map((config) => {
      const keys = autoStateKeys(config);
      const master = storage.get(sharedStorageKey(keys.master)) || null;
      const accounts = storage.get(sharedStorageKey(keys.accounts)) || [];

      return {
        id: config.id,
        title: config.title,
        own: config.farmerId === farmerId,
        master,
        accounts,

        /** Check the password against the master hash before decrypting the account's phrase */
        async decryptPhrase(account, password) {
          if (!(await bcrypt.compare(password, master.hashedPassword))) {
            throw new Error("Invalid password");
          }

          return encryption.decryptData({
            ...account.encryptedPhrase,
            password,
            asText: true,
          });
        },
      };
    })
    .filter((source) => source.master && source.accounts.length > 0)
    .sort((a, b) => Number(b.own) - Number(a.own));
}

customLogger("AUTOS", autos);

export default autos;
export { autosMap };
