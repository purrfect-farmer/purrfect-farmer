import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

const extractTasks = (list) =>
  Array.from(list).map((button) => {
    const onclick = button.getAttribute("onclick");
    const match = onclick.matchAll(/'([^']+)'/g);
    const result = Array.from(match).map((item) => item[1]);

    return {
      type: result[0],
      id: result[1],
      link: result[2],
    };
  });

export default function useMoneyBuxEarningsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["money-bux", "earnings"],
    queryFn: async ({ signal }) => {
      const htmlResponse = await api
        .post("https://moneybux.xyz/load/earnings", null, {
          signal,
        })
        .then((res) => res.data);

      const parser = new DOMParser();
      const html = parser.parseFromString(htmlResponse, "text/html");

      const dailyTasks = extractTasks(
        html.querySelectorAll("#tasks_daily button")
      );
      const gameTasks = extractTasks(
        html.querySelectorAll("#tasks_games button")
      );
      const socialTasks = extractTasks(
        html.querySelectorAll("#tasks_social button")
      );

      return {
        dailyTasks,
        gameTasks,
        socialTasks,
      };
    },
  });
}
