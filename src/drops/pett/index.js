import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "pett",
  mode: "session",
  title: "PettAI",
  icon,
  component: createLazyElement(() => import("./Pett")),
  entity: "Pett_AI_Delta_Bot",
  startParam: "REF-nKan1OQ",
  handleStartReply(messenger, message) {
    return messenger.waitForReply(() => message.click(0));
  },
  tasks: {},
});
