import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "voxel",
  title: "Voxel",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Voxel")),
  telegramLink: "https://t.me/voxel_verse_bot/app?startapp=1147265290",
  host: "api.voxelplay.app",
  netRequest: {
    origin: "https://api.voxelplay.app",
    domains: ["api.voxelplay.app"],
  },
  embedWebPage: true,

  tasks: {
    ["missions"]: false,
  },
});
