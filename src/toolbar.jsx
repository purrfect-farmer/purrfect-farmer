import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MiniAppToolbar from "./app/MiniAppToolbar.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MiniAppToolbar />
  </StrictMode>
);
