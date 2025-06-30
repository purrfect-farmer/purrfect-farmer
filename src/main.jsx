import "@/lib/bridge-client";
import "@/lib/polyfills";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupChromeStorage } from "@/lib/chrome-storage.js";

import Accounts from "./app/Accounts.jsx";

setupChromeStorage().then(() => {
  import("@/lib/TelegramWebClient.js").then((module) => {
    globalThis.TelegramWebClient = module.default;

    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <Accounts />
      </StrictMode>
    );
  });
});
