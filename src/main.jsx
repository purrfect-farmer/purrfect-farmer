import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: (query) => {
        return !queryClient.isMutating({
          mutationKey: query.queryKey.slice(0, 1),
        })
          ? query.meta?.defaultRefetchInterval ?? 20_000
          : false;
      },
    },
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
