import useFarmerContext from "./useFarmerContext";

export default function useFarmerApi() {
  return useFarmerContext().api;
}
