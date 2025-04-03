import useFarmerContext from "@/hooks/useFarmerContext";
import useStaticQuery from "@/hooks/useStaticQuery";

const extractItems = (message, page = 1) => {
  const list = message.buttons.slice(2).flat();

  return list.map((button) => {
    const match = button.text.match(/(.+)\s+([\d\.,]+)\s+\$(AIP|ETH)/);
    return {
      button,
      name: match[1],
      price: parseFloat(match[2].replaceAll(",", "")),
      currency: match[3],
      text: button.text,
      page,
    };
  });
};

/**
 * Cafeteria Query
 * @param {import("@tanstack/react-query").UseQueryOptions} options
 */
export default function usePettCafeteriaQuery(options) {
  const { messenger } = useFarmerContext();

  return useStaticQuery({
    ...options,
    queryKey: ["pett", "cafeteria"],
    async queryFn() {
      const start = await messenger.returnToHome();
      const firstPageMessage = await messenger.clickPath(
        start,
        "Store > Cafeteria"
      );

      const secondPageMessage = await messenger.clickButton(
        firstPageMessage,
        "→ 2"
      );

      const firstPageItems = extractItems(firstPageMessage, 1);
      const secondPageItems = extractItems(secondPageMessage, 2);

      return [...firstPageItems, ...secondPageItems];
    },
  });
}
