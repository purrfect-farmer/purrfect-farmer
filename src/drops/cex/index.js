import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "cex",
  title: "CEX",
  icon,
  component: createLazyElement(() => import("./CEX")),
  telegramLink: "https://t.me/cexio_tap_bot?start=1717159919141996",
  host: "app.cexptap.com",
  domains: ["app.cexptap.com"],
  authHeaders: ["x-appl-version", "x-request-userhash"],
  tasks: {
    ["tasks"]: false,
    ["cards"]: false,
  },
};
