import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

const defaultOptions = {
  retry(failureCount, error) {
    return !error?.response;
  },
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: defaultOptions,
    mutations: defaultOptions,
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  </StrictMode>
);
