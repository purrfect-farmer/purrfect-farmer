import useFarmerContext from "@/hooks/useFarmerContext";
import useStaticQuery from "@/hooks/useStaticQuery";

/**
 * Fridge Query
 * @param {import("@tanstack/react-query").UseQueryOptions} options
 */
export default function usePettFridgeQuery(options) {
  const { messenger } = useFarmerContext();

  return useStaticQuery({
    ...options,
    queryKey: ["pett", "fridge"],
    async queryFn() {
      const start = await messenger.returnToHome();
      const message = await messenger.clickPath(start, "Kitchen > Fridge");

      const text = message.message;
      const matches = text.matchAll(/([^\n]+) - ([\d\.,]+)/g).toArray();

      return matches.map((match) => ({
        title: match[1],
        value: parseFloat(match[2].replaceAll(",", "")),
      }));
    },
  });
}
