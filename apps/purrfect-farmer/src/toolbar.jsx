import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import MiniAppToolbar from "./app/MiniAppToolbar.jsx";
import { setupChromeStorage } from "./lib/chrome-storage.js";
import { BrowserRouter } from "react-router";

setupChromeStorage().then(() =>
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <MiniAppToolbar />
      </BrowserRouter>
    </StrictMode>
  )
);
