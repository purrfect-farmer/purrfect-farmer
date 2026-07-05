import "@/lib/polyfills";
import "@/lib/bridge-client";

import Accounts from "./app/Accounts.jsx";
import { BrowserRouter } from "react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import storage from "./lib/storage.js";

storage.setup().then(() => {
  import("@/lib/TelegramWebClient.js").then((module) => {
    globalThis.TelegramWebClient = module.default;

    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <BrowserRouter>
          <Accounts />
        </BrowserRouter>
      </StrictMode>,
    );
  });
});
