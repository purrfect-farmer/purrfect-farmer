import useAppQuery from "@/hooks/useAppQuery";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function useNotPixelUserQuery(options) {
  const { api } = useFarmerContext();

  return useAppQuery({
    ...options,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryKey: ["notpixel", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://notpx.app/api/v1/users/me", {
          signal,
        })
        .then((res) => res.data),
  });
}
