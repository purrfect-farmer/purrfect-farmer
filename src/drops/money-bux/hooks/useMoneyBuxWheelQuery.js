import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMoneyBuxWheelQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["money-bux", "wheel"],
    queryFn: async ({ signal }) => {
      const htmlResponse = await api
        .post("https://moneybux.xyz/load/wheel", null, {
          signal,
        })
        .then((res) => res.data);

      const parser = new DOMParser();
      const html = parser.parseFromString(htmlResponse, "text/html");

      const spins = Number(html.querySelector("#spins").textContent);
      const viewedAds = Number(
        html.querySelector("#viewed_ads_today").textContent
      );

      return {
        spins,
        viewedAds,
      };
    },
  });
}
