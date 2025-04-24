import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMoneyBuxTicketsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["money-bux", "tickets"],
    queryFn: async ({ signal }) => {
      const htmlResponse = await api
        .post("https://moneybux.xyz/load/get_tickets", null, {
          signal,
        })
        .then((res) => res.data);

      const parser = new DOMParser();
      const html = parser.parseFromString(htmlResponse, "text/html");

      const gigapub = Number(
        html.querySelector("#viewed_gigapub_today").textContent
      );
      const adextra = Number(
        html.querySelector("#viewed_adextra_today").textContent
      );
      const adexium = Number(
        html.querySelector("#viewed_adexium_today").textContent
      );
      const applanza = Number(
        html.querySelector("#viewed_applanza_today").textContent
      );
      const adsgram = Number(
        html.querySelector("#viewed_adsgram_today").textContent
      );

      return {
        gigapub,
        adextra,
        adexium,
        applanza,
        adsgram,
      };
    },
  });
}
