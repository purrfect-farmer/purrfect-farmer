import useFarmerContext from "./useFarmerContext";

export default function useFarmerInstance() {
  return useFarmerContext().instance;
}
