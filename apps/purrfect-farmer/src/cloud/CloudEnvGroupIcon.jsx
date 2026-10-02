import {
  HiOutlineClock,
  HiOutlineCog6Tooth,
  HiOutlineGlobeAlt,
  HiOutlinePaperAirplane,
  HiOutlinePuzzlePiece,
  HiOutlineSignal,
  HiOutlineSquares2X2,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";

import { farmersMap } from "@/core/farmers";

/** Icons for the settings groups */
const GROUP_ICONS = {
  general: HiOutlineCog6Tooth,
  telegram: HiOutlinePaperAirplane,
  captcha: HiOutlinePuzzlePiece,
  proxy: HiOutlineGlobeAlt,
  seeker: HiOutlineSignal,
  cron: HiOutlineClock,
  advanced: HiOutlineWrenchScrewdriver,
};

export default function CloudEnvGroupIcon({ group }) {
  const farmer = group.farmer ? farmersMap?.get(group.farmer) : null;
  const Icon = GROUP_ICONS[group.id] || HiOutlineSquares2X2;

  return farmer?.icon ? (
    <img src={farmer.icon} className="w-6 h-6 rounded-full shrink-0" />
  ) : (
    <Icon className="p-1 rounded-full size-6 shrink-0 bg-neutral-100 dark:bg-neutral-800" />
  );
}
