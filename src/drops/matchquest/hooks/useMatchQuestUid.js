import useFarmerContext from "@/hooks/useFarmerContext";

export default function useMatchQuestUid() {
  return useFarmerContext().telegramWebApp?.initDataUnsafe?.user?.id;
}
