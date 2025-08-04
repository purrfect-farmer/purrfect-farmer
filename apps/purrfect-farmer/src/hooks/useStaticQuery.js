import { useQuery } from "@tanstack/react-query";

/**
 * useStaticQuery
 * @param {import("@tanstack/react-query").UseQueryOptions} options
 * @returns
 */
export default function useStaticQuery(options) {
  return useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
    ...options,
  });
}
