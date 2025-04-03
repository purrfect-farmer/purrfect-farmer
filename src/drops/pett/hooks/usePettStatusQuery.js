import useFarmerContext from "@/hooks/useFarmerContext";
import useStaticQuery from "@/hooks/useStaticQuery";

export default function usePettStatusQuery() {
  const { messenger } = useFarmerContext();

  return useStaticQuery({
    queryKey: ["pett", "status"],
    queryFn: async () => {
      const { message } = await messenger.sendStart();
      const text = message.message;

      const balanceAIP = parseFloat(text.match(/([\d\.]+)\s+\$AIP/)[1]);
      const balanceETH = parseFloat(text.match(/([\d\.]+)\s+\$ETH/)[1]);
      const state = text.match(/PettBro is ([^\s]+)/)[1];
      const stats = Object.fromEntries(
        ["Level", "Hunger", "Health", "Energy", "Happiness", "Clean"].map(
          (item) => {
            const match = text.match(
              new RegExp(`([^\s\n]+)\\s+\\|\\s+${item}:\\s+(.+)\n`)
            );
            return [
              item,
              {
                icon: match[1],
                title: `${match[1]} ${item}`,
                value: parseFloat(match[2]),
              },
            ];
          }
        )
      );

      return { message, balanceAIP, balanceETH, stats, state };
    },
  });
}
