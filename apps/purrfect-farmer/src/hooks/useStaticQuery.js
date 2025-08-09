import useAppQuery from "./useAppQuery";

/**
 * useStaticQuery
 * @param {import("@tanstack/react-query").UseQueryOptions} options
 * @param {import("@tanstack/react-query").QueryClient | null} client
 */
export default function useStaticQuery(options, client) {
  return useAppQuery(
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: false,
      ...options,
    },
    client
  );
}
