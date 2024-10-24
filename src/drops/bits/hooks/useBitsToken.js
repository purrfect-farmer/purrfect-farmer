import useFarmerContext from "@/hooks/useFarmerContext";

export default function useBitsToken() {
  return useFarmerContext().userRequest.data?.token;
}
