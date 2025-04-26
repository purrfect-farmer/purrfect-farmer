import "@/lib/bridge-client";
import "@/lib/polyfills";

import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App.jsx";
import { createQueryClient } from "./lib/createQueryClient";

const queryClient = createQueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
