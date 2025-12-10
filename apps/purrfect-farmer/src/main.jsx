import "@/lib/bridge-client";
import "@/lib/polyfills";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import Accounts from "./app/Accounts.jsx";
import { BrowserRouter } from "react-router";
import storage from "./lib/storage.js";

storage.setup().then(() => {
  import("@/lib/TelegramWebClient.js").then((module) => {
    globalThis.TelegramWebClient = module.default;

    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <BrowserRouter>
          <Accounts />
        </BrowserRouter>
      </StrictMode>
    );
  });
});
