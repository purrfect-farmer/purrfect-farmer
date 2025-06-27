import useFarmerContext from "@/hooks/useFarmerContext";

export default function useTsubasaData() {
  const {
    authQuery: { data },
  } = useFarmerContext();
}
