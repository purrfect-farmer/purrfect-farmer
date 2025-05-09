import "@/lib/bridge-client";
import "@/lib/polyfills";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Accounts from "./app/Accounts.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Accounts />
  </StrictMode>
);
