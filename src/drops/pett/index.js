import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "pett",
  mode: "session",
  title: "PettAI",
  icon,
  component: createLazyElement(() => import("./Pett")),
  entity: "pett_ai_bot",
  startParam: "REF-nKan1OQ",
  handleStartReply(messenger, message) {
    return messenger.waitForReply(() => message.click(0));
  },
  tasks: {
    ["game"]: true,
  },
};
